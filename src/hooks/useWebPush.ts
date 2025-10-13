// src/hooks/useWebPush.ts
"use client";
import { useEffect, useState } from "react";
import {
  getToken,
  onMessage,
  deleteToken,
  type MessagePayload,
} from "firebase/messaging";
import { getMessagingSafe } from "@/lib/firebase";

const VAPID_KEY = process.env.NEXT_PUBLIC_FB_VAPID_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

function getOrCreateDeviceId() {
  // 로컬에 없으면 새로 만들고 저장
  const KEY = "webpush_device_id";
  let id = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
  if (!id && typeof window !== "undefined") {
    id = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    localStorage.setItem(KEY, id);
  }
  return id!;
}

export function useWebPush() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        setReady(true);
        return;
      }

      const swReg = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        {
          scope: "/",
          updateViaCache: "none",
        }
      );

      if (Notification.permission === "default") {
        const p = await Notification.requestPermission();
        if (p !== "granted") {
          setReady(true);
          return;
        }
      } else if (Notification.permission !== "granted") {
        setReady(true);
        return;
      }

      const messaging = getMessagingSafe();
      if (!messaging) {
        setReady(true);
        return;
      }

      const newToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (mounted && newToken) {
        setToken(newToken);

        const deviceId = getOrCreateDeviceId();

        const res = await fetch(`${BASE_URL}/api/push/tokens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // 세션 쿠키 쓰면 필요
          body: JSON.stringify({
            token: newToken,
            deviceId,
            platform: "WEB",
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("[push/tokens] save failed:", res.status, text);
        }
      }

      onMessage(messaging, (payload: MessagePayload) => {
        // 포그라운드에서 UI로 전달
        window.dispatchEvent(
          new CustomEvent("foreground-push", { detail: payload })
        );
      });

      setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const unregister = async () => {
    const messaging = getMessagingSafe();
    if (messaging && token) {
      try {
        await deleteToken(messaging);
      } catch {}
      // 서버 삭제 스펙이 토큰만 필요한지, deviceId도 필요한지에 따라 수정
      await fetch(`${BASE_URL}/api/push/tokens/${encodeURIComponent(token)}`, {
        method: "DELETE",
        credentials: "include",
      });
      setToken(null);
    }
  };

  return { token, ready, unregister };
}
