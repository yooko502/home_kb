import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Noto_Sans_SC } from "next/font/google";
import { AppProviders } from "@/components/providers";
import { TopNav } from "@/components/nav/TopNav";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
import "./globals.css";

const notoSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const notoJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "家庭物品助手",
  description: "家里电器、家具的说明书与购买凭证问答助手",
  appleWebApp: { capable: true, title: "物品助手", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0F6E66",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${notoSC.variable} ${notoJP.variable} min-h-dvh antialiased`}>
        <AppProviders>
          <TopNav />
          {children}
          <BottomTabBar />
        </AppProviders>
      </body>
    </html>
  );
}
