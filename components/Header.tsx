import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-quedera-surface bg-quedera-surface">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <ShieldIcon />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold text-quedera-navy tracking-[0.2em]">
              QUEDERA
            </span>
            <span className="text-lg font-bold text-quedera-emerald tracking-[0.15em]">
              SENTINEL
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-semibold tracking-wider">
          <Link href="/login" className="text-quedera-navy hover:text-quedera-emerald">
            LOGIN
          </Link>
          <Link href="/register/consultant" className="text-quedera-navy hover:text-quedera-emerald">
            REGISTER
          </Link>
        </nav>
      </div>
    </header>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="34"
      height="40"
      viewBox="0 0 34 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M17 1L2 6V19C2 28 8.5 34.5 17 39C25.5 34.5 32 28 32 19V6L17 1Z"
        stroke="#10B981"
        strokeWidth="2.5"
        fill="#F2F4F7"
      />
      <circle cx="17" cy="16" r="3.5" fill="#10B981" />
      <path
        d="M17 19.5V27"
        stroke="#10B981"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
