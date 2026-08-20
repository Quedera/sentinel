import Link from "next/link";
import type { Engagement } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

interface EngagementRowProps {
  engagement: Engagement;
  href?: string;
  valueLabel?: string;
  rightAction?: React.ReactNode;
}

export function EngagementRow({
  engagement,
  href,
  valueLabel,
  rightAction,
}: EngagementRowProps) {
  const row = (
    <div className="grid grid-cols-12 gap-4 py-4 border-b border-gray-100 items-center">
      <div className="col-span-4">
        <p className="font-semibold text-quedera-navy">{engagement.role}</p>
        <p className="text-xs text-gray-500">
          Engagement #{engagement.id} · {engagement.estimatedDays} days
        </p>
      </div>
      <div className="col-span-3 text-sm text-gray-600">
        {engagement.startDate} → {engagement.endDate}
      </div>
      <div className="col-span-2 text-sm font-semibold text-quedera-navy">
        {valueLabel ?? `£${engagement.estimatedValue.toLocaleString()}`}
      </div>
      <div className="col-span-3 flex justify-end items-center gap-3">
        {rightAction}
        <StatusBadge status={engagement.status} />
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block hover:bg-gray-50">
        {row}
      </Link>
    );
  }
  return row;
}
