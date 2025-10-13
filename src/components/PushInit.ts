// src/components/PushInit.tsx
"use client";
import { useWebPush } from "@/hooks/useWebPush";

export default function PushInit() {
  useWebPush(); // 화면에 안 보여도 OK. 훅만 실행되면 됨
  return null;
}
