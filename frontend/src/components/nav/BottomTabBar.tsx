"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatIcon, ListIcon, UploadIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/", label: "问答", Icon: ChatIcon, match: (p: string) => p === "/" },
  { href: "/ledger", label: "台账", Icon: ListIcon, match: (p: string) => p.startsWith("/ledger") },
  { href: "/upload", label: "上传", Icon: UploadIcon, match: (p: string) => p.startsWith("/upload") },
];

/** 窄屏底部标签栏；对话页全屏显示，不显示标签栏 */
export function BottomTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/chat")) return null;
  return (
    <nav
      aria-label="主导航"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {tabs.map(({ href, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] no-underline",
              active ? "font-medium text-accent hover:text-accent" : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon size={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
