"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/today", label: "今日用药" },
  { href: "/medications", label: "药品库" },
  { href: "/followups", label: "复诊计划" }
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (pathname === href) return true;
  return pathname.startsWith(href + "/");
}

export function NavLinks({ variant }: { variant?: "top" | "bottom" }) {
  const pathname = usePathname();
  const isBottom = variant === "bottom";
  const items = NAV_ITEMS;

  return (
    <>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const className = isBottom
          ? [
              "flex-1",
              "mm-btn",
              "rounded-2xl",
              "px-2",
              active ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-100"
            ].join(" ")
          : ["mm-seg-link", active ? "mm-seg-link-active" : ""].join(" ");

        return (
          <Link key={item.href} href={item.href} className={className} aria-current={active ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

