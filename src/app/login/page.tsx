// app/(auth)/login/page.tsx  (경로는 너 프로젝트에 맞게)
"use client";

import { logIn } from "@/api/auth";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ClipLoader } from "react-spinners"; // ⬅️ 추가
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const { checking, isLoggedIn } = useAuthGuard({ mode: "gotoHome" });

  const router = useRouter();
  const [form, setForm] = useState({ id: "", password: "" });
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [sending, setSending] = useState(false); // ⬅️ 추가

  if (checking || isLoggedIn) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg("");
      setSending(true); // ⬅️ 추가
      await logIn(form.id, form.password);
      router.push("/home");
    } catch (err) {
      console.error("로그인 에러:", err);
      setErrorMsg("로그인 중 오류가 발생했습니다.");
    } finally {
      setSending(false); // ⬅️ 추가
    }
  };

  return (
    <div
      className="
        mx-auto min-h-screen max-w-[420px]
        bg-[#F6F7F9] text-gray-900
        flex flex-col
      "
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <main className="flex-1 px-5 py-8 flex flex-col justify-center">
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className="text-[32px] font-extrabold text-blue-500 ">
            Ocean Campus
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 아이디 */}
          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-gray-700">
              아이디
            </label>
            <input
              name="id"
              type="text"
              value={form.id}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
              className="
                h-12 w-full rounded-2xl
                border-0 ring-1 ring-gray-200
                bg-white px-4 text-[15px]
                placeholder:text-gray-400
                focus:ring-2 focus:ring-blue-500 focus:outline-none
              "
            />
          </div>

          {/* 비밀번호 */}
          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-gray-700">
              비밀번호
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              className="
                h-12 w-full rounded-2xl
                border-0 ring-1 ring-gray-200
                bg-white px-4 text-[15px]
                placeholder:text-gray-400
                focus:ring-2 focus:ring-blue-500 focus:outline-none
              "
            />
          </div>

          {/* 로그인 CTA */}
          <button
            type="submit"
            disabled={sending}
            className="
              mt-2 h-12 w-full rounded-xl
              bg-[#3B82F6] text-white text-[15px] font-semibold
              shadow-md active:translate-y-[1px]
              transition cursor-pointer disabled:opacity-60
              flex items-center justify-center
            "
            aria-busy={sending}
          >
            {sending ? (
              <ClipLoader size={20} color="#FFFFFF" speedMultiplier={0.9} />
            ) : (
              "로그인"
            )}
          </button>
        </form>

        {/* 회원가입 링크 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/register")}
            className="text-[13px] font-medium text-gray-700 underline underline-offset-4 cursor-pointer"
          >
            회원가입
          </button>
        </div>
      </main>
    </div>
  );
}
