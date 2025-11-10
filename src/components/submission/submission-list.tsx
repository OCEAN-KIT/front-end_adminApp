// components/mobile/submission-list.tsx
"use client";

import { Submission } from "@/api/submissions";
import MobileSubmissionCard from "./submission-card";
import { ClipLoader } from "react-spinners";

type ListProps = {
  items: Submission[];
  loading?: boolean;
  onPressItem?: (id: number) => void;
  onLoadMore?: () => void; // 선택(무한스크롤/더보기)
};

export default function MobileSubmissionList({
  items,
  loading = false,
  onPressItem,
  onLoadMore,
}: ListProps) {
  if (loading && items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <ClipLoader />
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-gray-500 ring-1 ring-black/5">
        제출물이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <MobileSubmissionCard key={it.id} item={it} onPress={onPressItem} />
      ))}

      {/* (선택) 더보기 버튼 */}
      {onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className="mt-2 w-full rounded-2xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 active:scale-[0.997]"
        >
          더 보기
        </button>
      )}

      {loading && items.length > 0 && (
        <div className="flex items-center justify-center py-3">
          <ClipLoader size={20} />
        </div>
      )}
    </div>
  );
}
