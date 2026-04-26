import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NavLinks } from "./nav-links";
import { AppLogo } from "./logo";

export const metadata: Metadata = {
  title: "慢病用药小管家",
  description: "用药计划、提醒、库存与复诊管理（MVP）"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur">
          <div className="mm-container flex items-center justify-between gap-3 py-3">
            <Link href="/" className="inline-flex items-center gap-2 rounded-2xl px-1 py-1" aria-label="首页">
              <span className="mm-soft-icon h-10 w-10">
                <AppLogo size={26} />
              </span>
            </Link>

            <nav className="hidden md:flex" aria-label="主导航">
              <div className="mm-seg">
                <Suspense fallback={null}>
                  <NavLinks />
                </Suspense>
              </div>
            </nav>

            <Link href="/login" className="mm-soft-icon" aria-label="账号">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M20 21a8 8 0 0 0-16 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          <div className="mm-container pb-3 md:hidden">
            <div className="mm-seg w-full justify-between">
              <Suspense fallback={null}>
                <NavLinks />
              </Suspense>
            </div>
          </div>
        </header>

        <main className="mm-container mm-page pb-24 md:pb-10">{children}</main>

        <footer className="border-t border-zinc-200/70 bg-white">
          <div className="mm-container py-6 text-xs text-zinc-500">
            MVP：本地数据 + `.ics` 导出（先把提醒落到系统日历）。
          </div>
        </footer>
      </body>
    </html>
  );
}

