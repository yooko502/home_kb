"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { pingHealth } from "@/lib/api";
import type { AnswerLang } from "@/lib/types";

type BackendStatus = "connecting" | "ready" | "offline";

interface AppState {
  answerLang: AnswerLang;
  setAnswerLang: (l: AnswerLang) => void;
  backend: BackendStatus;
}

const Ctx = createContext<AppState | null>(null);
const LANG_KEY = "homekb.answerLang";

export function AppProviders({ children }: { children: ReactNode }) {
  const [answerLang, setLang] = useState<AnswerLang>("auto");
  const [backend, setBackend] = useState<BackendStatus>("connecting");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "auto" || saved === "zh" || saved === "ja") setLang(saved);
    } catch {
      /* 存储不可用时使用默认值 */
    }
  }, []);

  const setAnswerLang = useCallback((l: AnswerLang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  // 打开页面、从后台切回前台时请求 /healthz，提前唤醒 Cloud Run（计划书 6.4）
  useEffect(() => {
    let cancelled = false;
    const wake = async () => {
      setBackend((s) => (s === "ready" ? s : "connecting"));
      const ok = await pingHealth();
      if (!cancelled) setBackend(ok ? "ready" : "offline");
    };
    wake();
    const onVisible = () => {
      if (document.visibilityState === "visible") wake();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <Ctx.Provider value={{ answerLang, setAnswerLang, backend }}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProviders");
  return v;
}
