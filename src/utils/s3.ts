// utils/s3.ts (아니면 기존 keyToPublicUrl 유지)
export const keyToPublicUrl = (key: string) => {
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || "";
  if (!key) return "";
  if (/^https?:\/\//i.test(key)) return key; // 이미 절대 URL이면 그대로
  const cleanBase = base.replace(/\/+$/, "");
  const cleanKey = key.replace(/^\/+/, "");
  return cleanBase ? `${cleanBase}/${cleanKey}` : `/${cleanKey}`;
};
