// app/submit-management/mobile/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSubmissions } from "@/api/submissions";
import type { Submission } from "@/api/submissions";
import MobileSubmissionList from "@/components/submission/submission-list";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft } from "lucide-react"; // ✅ 아이콘 추가

type SubmissionsPage = Awaited<ReturnType<typeof fetchSubmissions>>;

export default function MobileSubmissionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  const { data, isFetching } = useQuery<SubmissionsPage>({
    queryKey: ["submissions", page],
    queryFn: () => fetchSubmissions({ page, size: 20 }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const items: Submission[] = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="mx-auto w-[380px] p-3">
      {/* 헤더: 뒤로가기 + 제목 */}
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="-ml-2 mr-2 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-[17px] font-semibold">제출 목록</h1>
      </div>

      <MobileSubmissionList
        items={items}
        loading={isFetching}
        onPressItem={(id) => router.push(`/review/${id}`)}
        onLoadMore={meta?.hasNext ? () => setPage((p) => p + 1) : undefined}
      />
    </div>
  );
}
