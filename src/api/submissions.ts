// api/submissions.ts
import axiosInstance from "@/utils/axiosInstance";

/** 생성 요청/응답 타입 (이미 쓰고있으면 기존 타입 유지해도 OK) */
export interface SubmissionCreateRequest {
  siteName: string;
  activityType: "TRANSPLANT" | "TRASH_COLLECTION" | "URCHIN_REMOVAL" | "OTHER";
  submittedAt: string; // "YYYY-MM-DDTHH:mm:ss.SSS"
  authorName: string;
  authorEmail: string;
  feedbackText?: string;
  latitude: number;
  longitude: number;
  basicEnv: {
    recordDate: string; // "YYYY-MM-DD"
    startTime: string; // "HH:mm:ss"
    endTime: string; // "HH:mm:ss"
    waterTempC: number;
    visibilityM: number;
    depthM: number;
    currentState: "LOW" | "MEDIUM" | "HIGH";
    weather: "SUNNY" | "CLOUDY" | "RAIN" | string;
  };
  participants: {
    leaderName: string;
    participantCount: number;
    role: "CITIZEN_DIVER" | string;
  };
  activity: {
    type: SubmissionCreateRequest["activityType"];
    details: string;
    collectionAmount: number;
    durationHours: number;
  };
  attachments: Array<{
    fileName: string;
    fileUrl: string; // S3 key
    mimeType: string;
    fileSize: number;
  }>;
}

export interface SubmissionCreateResponse {
  success: boolean;
  data?: { submissionId: number };
  code?: string;
  message?: string | Record<string, unknown>;
}

/** 서버가 주는 목록 아이템 원형 */
export interface SubmissionListItemServer {
  submissionId: number;
  siteName: string;
  activityType: "TRANSPLANT" | "TRASH_COLLECTION" | "URCHIN_REMOVAL" | "OTHER";
  submittedAt: string; // ISO
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  authorName: string;
  authorEmail: string;
  attachmentCount: number;
}

/** 프런트에서 쓰기 쉬운 목록 아이템 */
export interface Submission {
  id: number;
  siteName: string;
  activityType: SubmissionListItemServer["activityType"];
  submittedAt: string; // ISO string
  status: SubmissionListItemServer["status"];
  authorName: string;
  authorEmail: string;
  attachmentCount: number;
}

/** 페이지네이션 메타 */
export interface PageMeta {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** 목록 응답 래퍼 */
export interface SubmissionListResponse {
  success: boolean;
  data: {
    content: SubmissionListItemServer[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  code?: string;
  message?: string | Record<string, unknown>;
}

/** 생성 */
export async function createSubmission(
  payload: SubmissionCreateRequest
): Promise<SubmissionCreateResponse> {
  console.log("[createSubmission] payload =", JSON.stringify(payload, null, 2));
  try {
    const { data } = await axiosInstance.post<SubmissionCreateResponse>(
      "/api/admin/submissions",
      payload
    );
    return data;
  } catch (err) {
    // 상위에서 처리할 수 있도록 그대로 throw
    throw err;
  }
}

/** 목록 조회 */
export async function fetchSubmissions(params?: {
  page?: number;
  size?: number;
  status?: string; // 선택: 서버가 지원하면 상태 필터
  keyword?: string; // 선택: 검색어
}) {
  const { page = 0, size = 20, status, keyword } = params ?? {};

  const { data } = await axiosInstance.get<SubmissionListResponse>(
    "/api/admin/submissions",
    {
      params: {
        page,
        size,
        status,
        keyword,
      },
    }
  );

  // 401/403 등은 axiosInstance 인터셉터에서 처리되거나 여기서 throw
  if (!data?.success) {
    const msg =
      typeof data?.message === "string"
        ? data.message
        : "목록 조회 실패 (success=false)";
    throw new Error(msg);
  }

  const content: Submission[] =
    data.data.content?.map((it) => ({
      id: it.submissionId,
      siteName: it.siteName,
      activityType: it.activityType,
      submittedAt: it.submittedAt,
      status: it.status,
      authorName: it.authorName,
      authorEmail: it.authorEmail,
      attachmentCount: it.attachmentCount,
    })) ?? [];

  const meta: PageMeta = {
    page: data.data.page,
    size: data.data.size,
    totalPages: data.data.totalPages,
    totalElements: data.data.totalElements,
    first: data.data.first,
    last: data.data.last,
    hasNext: data.data.hasNext,
    hasPrevious: data.data.hasPrevious,
  };

  return { items: content, meta };
}
