import type { EngagementStatus } from "@/lib/types";
import { ENGAGEMENT_STATUS_LABELS } from "@/lib/types";

interface StatusBadgeProps {
  status: EngagementStatus;
}

const STATUS_COLORS: Record<EngagementStatus, string> = {
  DRAFT: "bg-quedera-surface text-quedera-navy/80",
  HIRE_REQUESTED: "bg-quedera-cyan/10 text-quedera-cyan",
  CONTRACT_UPLOADED: "bg-quedera-cyan/10 text-quedera-cyan",
  AWAITING_CONSULTANT: "bg-quedera-surface text-quedera-amber",
  VIEWED: "bg-quedera-surface text-quedera-amber",
  SIGNED: "bg-quedera-emerald/10 text-quedera-emerald",
  CONFIRMED: "bg-quedera-emerald text-quedera-surface",
  DECLINED: "bg-quedera-surface text-quedera-navy",
  EXPIRED: "bg-quedera-surface text-quedera-navy",
  ACTIVE: "bg-quedera-emerald/10 text-quedera-emerald",
  COMPLETED: "bg-quedera-surface text-quedera-navy/80",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`badge ${STATUS_COLORS[status]}`}>
      {ENGAGEMENT_STATUS_LABELS[status]}
    </span>
  );
}
