"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export const navItems = [
  { href: "/chat", label: "对话", match: (p: string) => p === "/" || p.startsWith("/chat") },
  { href: "/upload", label: "上传入库", match: (p: string) => p.startsWith("/upload") },
  { href: "/ledger", label: "物品台账", match: (p: string) => p.startsWith("/ledger") },
];

export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-accent text-white"
      style={{ width: size, height: size }}
    >
      <HomeIcon size={Math.round(size * 0.53)} strokeWidth={2} />
    </span>
  );
}

/** 宽屏（md 以上）顶部导航 */
export function TopNav() {
  const pathname = usePathname();
  return (
    <header className="hidden border-b border-line bg-surface md:block">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-7 px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 text-[17px] font-bold text-ink no-underline hover:text-ink">
          <BrandMark />
          家庭物品助手
        </Link>
        <nav aria-label="主导航" className="flex flex-wrap gap-1">
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-[15px] no-underline",
                  active ? "bg-muted font-medium text-ink hover:text-ink" : "text-ink-muted hover:bg-muted/60 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
