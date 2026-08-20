import type { EngagementStatus } from "@/lib/types";
import { ENGAGEMENT_STATUS_LABELS } from "@/lib/types";

interface StatusBadgeProps {
  status: EngagementStatus;
}

const STATUS_COLORS: Record<EngagementStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  HIRE_REQUESTED: "bg-blue-100 text-blue-700",
  CONTRACT_UPLOADED: "bg-blue-100 text-blue-700",
  AWAITING_CONSULTANT: "bg-yellow-100 text-yellow-700",
  VIEWED: "bg-yellow-100 text-yellow-700",
  SIGNED: "bg-sentinel-tint text-sentinel-dark",
  CONFIRMED: "bg-sentinel text-white",
  DECLINED: "bg-red-100 text-red-700",
  EXPIRED: "bg-red-100 text-red-700",
  ACTIVE: "bg-sentinel-tint text-sentinel-dark",
  COMPLETED: "bg-gray-100 text-gray-700",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`badge ${STATUS_COLORS[status]}`}>
      {ENGAGEMENT_STATUS_LABELS[status]}
    </span>
  );
}
