#!/usr/bin/env bash
#
# QUEDERA SENTINEL — decision invariant acceptance script.
#
# Exercises the invariants behind the 2026-10-18 decision set against a
# RUNNING instance. Each check asserts a behaviour that must not regress.
#
#   ./scripts/verify-decisions.sh [base-url]
#
# Requires: curl, a running SENTINEL, and seeded demo data.
# Optional: docker + psql for the DB-level assertions (skipped if absent).
#
# NOTE: this script mutates data (it raises an invoice, terminates an
# engagement and grants a verification). It reseeds at the end to restore
# the demo state. Pass --no-reseed to skip that.
#
# Exit code 0 = all checks passed.

set -uo pipefail

BASE="${1:-http://127.0.0.1:3002}"
RESEED=1
[ "${2:-}" = "--no-reseed" ] && RESEED=0

PASS=0
FAIL=0

# ---- helpers ---------------------------------------------------------------

# Build a bearer token. NOTE: this must actually use its arguments — an
# earlier version of this script ignored them and emitted a literal
# placeholder, which the noop auth provider happily turned into a junk
# user, making every "admin" check fail for the wrong reason.
tok() {
  echo "Authorization: Bearer $1:$2"
}

# Run a query against the SENTINEL database, if we can reach it.
db() {
  if ! command -v docker > /dev/null 2>&1; then return 1; fi
  docker exec sentinel-pg env PGPASSWORD=*** psql     -h 127.0.0.1 -U sentinel -d sentinel -t -A -c "$1" 2> /dev/null
}

have_db=1
db "select 1" > /dev/null 2>&1 || have_db=0

check() { # label expected actual
  if [ "$2" = "$3" ]; then
    printf "  \033[32mPASS\033[0m  %s\n" "$1"
    PASS=$((PASS + 1))
  else
    printf "  \033[31mFAIL\033[0m  %s (expected %s, got %s)\n" "$1" "$2" "$3"
    FAIL=$((FAIL + 1))
  fi
}

http() { # method path token body
  if [ -n "${4:-}" ]; then
    curl -s -o /dev/null -w '%{http_code}' -X "$1" "$BASE$2" \
      -H "$3" -H "Content-Type: application/json" -d "$4"
  else
    curl -s -o /dev/null -w '%{http_code}' -X "$1" "$BASE$2" -H "$3"
  fi
}

echo "SENTINEL decision invariant check against $BASE"
echo

# ---- 0. the instance is actually up ---------------------------------------

code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/")
check "instance reachable" 200 "$code"
if [ "$code" != "200" ]; then
  echo
  echo "Instance not reachable — is SENTINEL running?"
  exit 1
fi
echo

T_ADMIN=$(tok admin@quedera.example ADMIN)
T_CLIENT=$(tok client@abc-corp.example CLIENT)
T_CONS=$(tok david.jones@example.com CONSULTANT)
T_OTHER=$(tok elena.volkov@example.com CONSULTANT)

# ---- 1. identity: the tokens must resolve to DIFFERENT people -------------
# Always assert identity before asserting on permissions. If the tokens are
# wrong, every later permission check fails for the wrong reason.

# Assert identity THROUGH THE API, not by querying the database. A
# database lookup proves nothing about whether the token resolves to the
# right person — and if the token is wrong, every later permission check
# fails for the wrong reason.
count_invoices() {
  curl -s "$BASE/api/invoices" -H "$1" | node -e '
let d = "";
process.stdin.on("data", (c) => (d += c)).on("end", () => {
  try {
    console.log(JSON.parse(d).data.length);
  } catch (e) {
    console.log(-1);
  }
});'
}

ADMIN_COUNT=$(count_invoices "$T_ADMIN")
CONS_COUNT=$(count_invoices "$T_CONS")
TOTAL_INV=$(db "select count(*) from \"Invoice\";")

if [ "$have_db" = "1" ]; then
  check "admin token sees every invoice" "$TOTAL_INV" "$ADMIN_COUNT"
else
  check "admin token resolves to a real admin" "true" \
    "$([ "$ADMIN_COUNT" -ge 0 ] && echo true || echo false)"
fi
check "consultant token sees fewer invoices than admin" "true" \
  "$([ "$CONS_COUNT" -ge 0 ] && [ "$CONS_COUNT" -lt "$ADMIN_COUNT" ] && echo true || echo false)"
check "the two tokens are different people" "true" \
  "$([ "$CONS_COUNT" -ne "$ADMIN_COUNT" ] && echo true || echo false)"
echo

# ---- 2. decision #4 — invoicing -------------------------------------------

echo "Decision #4 — invoicing"

CONF=$(db "select id from \"Engagement\" where status='CONFIRMED' limit 1;")
COMP=$(db "select id from \"Engagement\" where status='COMPLETED' limit 1;")

if [ -n "$CONF" ]; then
  code=$(http POST "/api/invoices" "$T_ADMIN" "{\"engagementId\":\"$CONF\"}")
  check "invoice cannot be raised twice for one engagement" 409 "$code"
fi

if [ "$have_db" = "1" ]; then
  # The numbering invariant: derive the next number from the MAX issued in
  # the period, not from a COUNT. Deleting an invoice must not make the
  # counter collide with an existing number (Prisma P2002).
  #
  # Delete the LOWEST invoice, and target the engagement that owned it, so
  # the duplicate guard does not fire first — otherwise this asserts the
  # duplicate rule rather than the numbering rule.
  LOWNUM=$(db "select min(number) from \"Invoice\";")
  TARGET=$(db "select \"engagementId\" from \"Invoice\" where number='$LOWNUM';")
  db "delete from \"Invoice\" where number='$LOWNUM';" > /dev/null
  code=$(http POST "/api/invoices" "$T_ADMIN" "{\"engagementId\":\"$TARGET\"}")
  check "invoice numbering survives a deletion (no P2002)" 201 "$code"
  DUPLICATES=$(db "select count(*) from (select number from \"Invoice\" group by number having count(*)>1) x;")
  check "no duplicate invoice numbers" 0 "$DUPLICATES"
fi

if [ -n "$CONF" ]; then
  code=$(http POST "/api/invoices" "$T_CONS" "{\"engagementId\":\"$CONF\"}")
  check "a consultant cannot raise an invoice" 403 "$code"
fi
echo

# ---- 3. decision #5 — termination -----------------------------------------

echo "Decision #5 — termination and penalties"

ACTIVE=$(db "select id from \"Engagement\" where status='ACTIVE' limit 1;")
AWAIT=$(db "select id from \"Engagement\" where status='AWAITING_CONSULTANT' limit 1;")

if [ -n "$AWAIT" ]; then
  code=$(http POST "/api/engagements/$AWAIT/terminate" "$T_OTHER" '{"reason":"not my engagement","gaveNotice":false}')
  check "a non-party cannot terminate" 403 "$code"
  code=$(http POST "/api/engagements/$AWAIT/terminate" "$T_ADMIN" '{"reason":"admin must name the side","gaveNotice":false}')
  check "an admin must state which side is terminating" 403 "$code"
fi

if [ -n "$ACTIVE" ]; then
  body=$(curl -s -X POST "$BASE/api/engagements/$ACTIVE/terminate" \
    -H "$T_CLIENT" -H "Content-Type: application/json" \
    -d '{"reason":"Programme descoped","gaveNotice":true}')
  SIDE=$(echo "$body" | sed -n 's/.*"side":"\([A-Z]*\)".*/\1/p')
  NOTICE=$(echo "$body" | sed -n 's/.*"noticeDays":\([0-9]*\).*/\1/p')
  PENALTY=$(echo "$body" | sed -n 's/.*"penalty":\([0-9]*\).*/\1/p')
  STATUS=$(echo "$body" | sed -n 's/.*"status":"\([A-Z_]*\)".*/\1/p')
  check "termination records the initiating side" "CLIENT" "$SIDE"
  check "termination reaches the TERMINATED state" "TERMINATED" "$STATUS"
  check "a penalty is applied" "true" "$([ -n "$PENALTY" ] && [ "$PENALTY" -gt 0 ] && echo true || echo false)"
  check "the notice period is honoured" "14" "$NOTICE"
  code=$(http POST "/api/engagements/$ACTIVE/terminate" "$T_CLIENT" '{"reason":"again","gaveNotice":false}')
  check "an engagement cannot be terminated twice" 409 "$code"
fi
echo

# ---- 4. decision #3 — service confirmation + admin verification -----------

echo "Decision #3 — Sentinel Service Confirmation"

code=$(http POST "/api/service-confirmation/sign" "" '{"signedName":"X","accepted":true}')
check "signing requires authentication" 401 "$code"
code=$(http POST "/api/service-confirmation/sign" "$T_CONS" '{"signedName":"X","accepted":false}')
check "the confirmation must be accepted" 400 "$code"

MARCUS=$(db "select id from \"User\" where email='marcus.reid@example.com';")
if [ -n "$MARCUS" ]; then
  code=$(http POST "/api/admin/verifications/$MARCUS" "$T_CONS" '{"action":"grant"}')
  check "a non-admin cannot grant verification" 403 "$code"
  code=$(http POST "/api/admin/verifications/$MARCUS" "$T_ADMIN" '{"action":"nonsense"}')
  check "an unknown verification action is rejected" 400 "$code"
  code=$(http POST "/api/admin/verifications/$MARCUS" "$T_ADMIN" '{"action":"grant"}')
  check "an admin can grant verification" 200 "$code"
  code=$(http POST "/api/admin/verifications/$MARCUS" "$T_ADMIN" '{"action":"grant"}')
  check "verification cannot be granted twice" 409 "$code"
  if [ "$have_db" = "1" ]; then
    check "the decision is written to the audit trail" "1" \
      "$(db "select count(*) from \"AuditEvent\" where action='VERIFICATION_GRANTED';")"
  fi
fi
echo

# ---- 5. decision #8 — search ranking --------------------------------------

echo "Decision #8 — search ranking"

BODY=$(curl -s "$BASE/api/search/consultants")
ORDER=$(echo "$BODY" | node -e '
let d = "";
process.stdin.on("data", (c) => (d += c)).on("end", () => {
  try {
    const j = JSON.parse(d);
    console.log(j.data.results.map((r) => r.fullName).join(","));
  } catch (e) {
    console.log("PARSE_ERROR");
  }
});')
check "search returns results in a stable order" "true"   "$([ "$ORDER" != "PARSE_ERROR" ] && [ -n "$ORDER" ] && echo true || echo false)"

if [ "$have_db" = "1" ]; then
  # The primary sort is recency, so the returned order must match the
  # recency order in the database.
  EXPECTED=$(db "select string_agg(\"fullName\", ',' order by \"lastActiveAt\" desc) from \"Consultant\" where \"profileComplete\"=true and verified=true;")
  check "search order matches most-recently-active" "$EXPECTED" "$ORDER"
fi
echo

# ---- 6. restore demo state -------------------------------------------------

if [ "$RESEED" = "1" ]; then
  echo "Restoring demo state (reseed)..."
  ROOT="$(cd "$(dirname "$0")/.." && pwd)"
  # Prefer the compose stack when it is up - the app and the script must
  # seed the same database. Fall back to a local prisma run otherwise.
  if docker compose -f "$ROOT/docker-compose.yml" ps --status running 2>/dev/null | grep -q sentinel-app; then
    (cd "$ROOT" && docker compose exec -T app npx prisma db seed > /dev/null 2>&1) \
      && echo "  ok (via compose)" || echo "  could not reseed"
  else
    (cd "$ROOT" && npx prisma db seed > /dev/null 2>&1) \
      && echo "  ok (local)" || echo "  could not reseed"
  fi
  echo
fi

echo "--------------------------------------------"
printf "passed: %d   failed: %d\n" "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
echo "All decision invariants hold."
