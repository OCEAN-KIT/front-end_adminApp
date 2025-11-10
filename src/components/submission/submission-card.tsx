// components/mobile/submission-card.tsx
"use client";

import { Submission } from "@/api/submissions";

type CardProps = {
  item: Submission;
  onPress?: (id: number) => void;
};

export default function MobileSubmissionCard({ item, onPress }: CardProps) {
  const date = item.submittedAt?.slice(0, 10) ?? "";
  const time = item.submittedAt?.slice(11, 16) ?? "";

  const statusBadge =
    {
      PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
      APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
    }[item.status] || "bg-gray-50 text-gray-600 ring-gray-200";

  return (
    <button
      type="button"
      // onClick={() => onPress?.(item.id)}
      className="w-full rounded-2xl bg-white pt-5 text-left "
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-[15px] font-semibold text-gray-900">
            {item.siteName}
          </div>
          <div className="mt-1 text-[13px] text-gray-500">
            {date} {time} · {item.activityType}
          </div>
          <div className="mt-1 text-[13px] text-gray-500">
            {item.authorName} ({item.attachmentCount}개 첨부)
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[12px] font-semibold ring-1 ${statusBadge}`}
        >
          {item.status}
        </span>
      </div>
    </button>
  );
}
