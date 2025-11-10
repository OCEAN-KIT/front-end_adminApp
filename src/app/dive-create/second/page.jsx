// app/dive-create/second/page.jsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/api/upload-image";
import { createSubmission } from "@/api/submissions";

const DEBUG = true;
const TEST_NO_ATTACH = false;

/** S3 key -> public URL (뷰에서만 사용; 서버 저장은 key만) */
const keyToPublicUrl = (key) => {
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || "";
  const cleanBase = base.replace(/\/+$/, "");
  const cleanKey = String(key || "").replace(/^\/+/, "");
  return cleanBase ? `${cleanBase}/${cleanKey}` : `/${cleanKey}`;
};

const n = (v, fb = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : fb;
};

const pad = (num, len = 2) => String(num).padStart(len, "0");
const toLocalDateTimeString = (d) => {
  const date = typeof d === "string" ? new Date(d) : d;
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}.${ms}`;
};

function labelToActivityType(label) {
  switch (label) {
    case "이식":
      return "TRANSPLANT";
    case "폐기물 수거":
      return "TRASH_COLLECTION";
    case "성게 제거":
      return "URCHIN_REMOVAL";
    case "연구":
    case "모니터링":
    case "기타":
    default:
      return "OTHER";
  }
}

export default function DiveCreateStep2Page() {
  const router = useRouter();

  // 활동 유형 선택(서버 enum 대응)
  const [workType, setWorkType] = useState("이식");

  // 내용/사건
  const [details, setDetails] = useState("");
  const [incidentText, setIncidentText] = useState("");
  const DETAILS_MAX = 2000;
  const INCIDENT_MAX = 2000;

  // 첨부
  const [attachments, setAttachments] = useState([]);
  const fileRef = useRef(null);

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const next = [...attachments, ...files].slice(0, 10);
    setAttachments(next);
    if (fileRef.current) fileRef.current.value = "";
  };
  const removeOne = (idx) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const toHHMMSS = (t) => {
    if (!t) return "00:00:00";
    const pad = (n, len = 2) => String(Number(n) || 0).padStart(len, "0");
    return `${pad(t.hour)}:${pad(t.minute)}:${pad(t.second)}`;
  };

  async function handleSubmit() {
    try {
      // 1) step1 저장분 복구
      const raw = sessionStorage.getItem("diveDraft");
      const d = raw ? JSON.parse(raw) : {};
      if (DEBUG) console.log("[submit] step1 draft =", d);

      // 2) 첨부 업로드
      let uploaded = [];
      if (!TEST_NO_ATTACH) {
        for (const f of attachments) {
          const key = await uploadImage(f); // presigned PUT
          if (DEBUG)
            console.log("[upload] done =>", {
              key,
              preview: keyToPublicUrl(key),
            });
          uploaded.push({
            fileName: f.name,
            fileUrl: key, // ✅ 서버에는 key만!
            mimeType: f.type,
            fileSize: n(f.size),
          });
        }
      }

      // 3) activityType, details
      const apiType = labelToActivityType(workType);
      const detailsCombined = incidentText?.trim()
        ? `${details}\n\n[환경이상/사고 보고]\n${incidentText}`
        : details;

      // 4) payload (Swagger 스펙 준수)
      const payload = {
        siteName: d.siteName || "Unknown Site",
        activityType: apiType,
        submittedAt: toLocalDateTimeString(new Date()),
        authorName: "string",
        authorEmail: "string",
        feedbackText: "",
        latitude: n(d.latitude),
        longitude: n(d.longitude),
        basicEnv: {
          recordDate: d.recordDate ?? new Date().toISOString().slice(0, 10),
          startTime: toHHMMSS(d.startTime), // "HH:mm:ss"
          endTime: toHHMMSS(d.endTime ?? d.startTime), // "HH:mm:ss"
          waterTempC: n(d.waterTempC),
          visibilityM: n(d.visibilityM),
          depthM: n(d.depthM),
          currentState: d.currentState || "LOW",
          weather: d.weather || "SUNNY",
        },
        participants: {
          leaderName: "김다이버",
          participantCount: 1,
          role: "CITIZEN_DIVER",
        },
        activity: {
          type: apiType,
          details: detailsCombined,
          collectionAmount: 0,
          durationHours: 0,
        },
        attachments: uploaded,
      };

      if (DEBUG)
        console.log("[submit] payload =", JSON.stringify(payload, null, 2));

      const res = await createSubmission(payload);
      console.log("[submit] response =", res);
      alert("제출 완료!");
      router.replace("/");
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error("[submit] ERROR status =", status);
      console.error("[submit] ERROR body   =", data);
      alert(
        status === 500
          ? "서버 500 오류: 콘솔 로그 확인"
          : `제출 실패: ${status ?? ""}`
      );
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-[380px] px-4 py-5">
        {/* 작업 유형 */}
        <div>
          <div className="text-[15px] font-semibold text-gray-800 mb-2">
            작업 유형
          </div>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[16px] shadow-sm"
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
            >
              <option>이식</option>
              <option>폐기물 수거</option>
              <option>성게 제거</option>
              <option>연구</option>
              <option>모니터링</option>
              <option>기타</option>
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              ▾
            </span>
          </div>
        </div>

        {/* 작업 내용 */}
        <div className="mt-6">
          <div className="text-[15px] font-semibold text-gray-800 mb-2">
            작업 내용
          </div>
          <div className="relative">
            <textarea
              className="w-full h-44 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] shadow-sm outline-none"
              placeholder="메시지를 입력해 주세요."
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, DETAILS_MAX))}
              maxLength={DETAILS_MAX}
            />
            <div className="absolute right-4 bottom-3 text-gray-400 text-sm">
              {details.length}/{DETAILS_MAX}
            </div>
          </div>
        </div>

        {/* 환경이상 / 사고 보고 */}
        <div className="mt-6">
          <div className="text-[15px] font-semibold text-gray-800 mb-2">
            환경이상 / 사고 보고
          </div>
          <div className="relative">
            <textarea
              className="w-full h-40 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] shadow-sm outline-none"
              placeholder="발생한 환경 이상 징후나 안전 사고 내용을 상세히 입력해 주세요."
              value={incidentText}
              onChange={(e) =>
                setIncidentText(e.target.value.slice(0, INCIDENT_MAX))
              }
              maxLength={INCIDENT_MAX}
            />
            <div className="absolute right-4 bottom-3 text-gray-400 text-sm">
              {incidentText.length}/{INCIDENT_MAX}
            </div>
          </div>
        </div>

        {/* 첨부 */}
        <div className="mt-6">
          <div className="text-[15px] font-semibold text-gray-800 mb-2">
            활동 사진 및 동영상
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={onPickFiles}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-20 w-20 rounded-2xl bg-gray-100 flex flex-col items-center justify-center text-gray-600 shadow-sm cursor-pointer"
            >
              <span className="text-2xl">📷</span>
              <span className="text-xs mt-1">{attachments.length}/10</span>
            </button>
            <div className="flex flex-wrap gap-2">
              {attachments.map((f, idx) => (
                <div
                  key={`${f.name}-${idx}`}
                  className="relative h-20 w-20 overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm"
                >
                  {f.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
                      🎬
                    </div>
                  )}
                  <button
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-black/70 text-white text-xs"
                    onClick={() => removeOne(idx)}
                    type="button"
                    aria-label="remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              const raw = sessionStorage.getItem("diveDraft");
              console.log("draft payload:", raw ? JSON.parse(raw) : {});
              alert("임시 저장(콘솔 확인)");
            }}
            className="h-12 rounded-2xl bg-white text-gray-800 font-semibold shadow-sm border border-gray-200"
          >
            임시 저장
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="h-12 rounded-2xl bg-[#2F80ED] text-white font-semibold shadow-md hover:brightness-105 disabled:opacity-50"
            disabled={!details && !incidentText}
          >
            제출하기
          </button>
        </div>
      </div>
    </div>
  );
}
