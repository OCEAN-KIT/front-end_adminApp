// src/components/DebugPushPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { useWebPush } from "@/hooks/useWebPush";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export default function DebugPushPanel() {
  const { token } = useWebPush(); // PushInit만 쓰고 있다면 여기서도 훅 한번 더 써도 OK
  const [resp, setResp] = useState<string>("");

  useEffect(() => {
    const handler = (e: WindowEventMap["foreground-push"]) => {
      const p = e.detail;

      // data는 Record<string, string> | undefined 이므로 브래킷으로 안전 접근
      const title = p.notification?.title ?? p.data?.["title"] ?? "푸시 도착";
      const body = p.notification?.body ?? p.data?.["body"] ?? "";

      alert(`${title}\n${body}`);
    };

    window.addEventListener("foreground-push", handler);
    return () => window.removeEventListener("foreground-push", handler);
  }, []);

  const sendTest = async () => {
    if (!token) {
      alert("아직 토큰이 없어요. 알림 권한 허용 + 새로고침 후 다시 시도!");
      return;
    }

    const payload = {
      userIds: [], // 토큰으로 보낼 거라면 비워둠
      tokens: [token], // 내 브라우저 토큰
      title: "테스트 알림",
      body: "포그라운드/백그라운드 수신 확인용",
      url: `${location.origin}/home?from=push`, // 클릭 시 열릴 경로
    };

    const res = await fetch(`${BASE_URL}/api/push/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // 서버가 세션 인증이면 필요
      body: JSON.stringify(payload),
    });

    console.log(res);
  };

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        border: "1px solid #ddd",
        borderRadius: 8,
      }}
    >
      <b>🔔 Push Send Debug</b>
      <div className="border" style={{ marginTop: 8 }}>
        내 토큰: {token ? token.slice(0, 16) + "..." : "(없음)"}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="border" onClick={sendTest} disabled={!token}>
          테스트 푸시 보내기
        </button>
        <button
          className="border"
          onClick={() => token && navigator.clipboard.writeText(token!)}
          disabled={!token}
        >
          토큰 복사
        </button>
      </div>
      {resp && (
        <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{resp}</pre>
      )}
    </div>
  );
}
