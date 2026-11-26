import type { ReactNode } from "react";

/**
 * 回答正文的轻量渲染（约定见 lib/types.ts 的 ChatMessage.content）：
 * 段落、有序列表、**粗体**、`代码`、[[日文按键]]、[n] 引用编号。
 * 流式输出过程中可以反复调用，未闭合的标记按普通文本显示。
 */
export function AnswerBody({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];

  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ol key={`ol-${blocks.length}`} className="mb-2 list-decimal pl-[22px] last:mb-0">
        {list.map((l, i) => (
          <li key={i}>{renderInline(l)}</li>
        ))}
      </ol>,
    );
    list = [];
  };

  for (const line of lines) {
    const m = /^\s*\d+[.、]\s*(.*)$/.exec(line);
    if (m) {
      list.push(m[1]);
      continue;
    }
    flush();
    if (line.trim()) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="mb-2 last:mb-0">
          {renderInline(line)}
        </p>,
      );
    }
  }
  flush();
  return <>{blocks}</>;
}

const TOKEN = /(\*\*[^*]+\*\*|\[\[[^\]]+\]\]|\[\d+\]|`[^`]+`)/g;

function renderInline(s: string): ReactNode[] {
  return s.split(TOKEN).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("[[") && part.endsWith("]]"))
      return (
        <span key={i} className="kbd-ja" lang="ja">
          {part.slice(2, -2)}
        </span>
      );
    if (/^\[\d+\]$/.test(part))
      return (
        <sup key={i} className="cite">
          {part.slice(1, -1)}
        </sup>
      );
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} className="rounded bg-muted px-1 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    return part;
  });
}

/** 复制时去掉标记 */
export function plainText(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "「$1」")
    .replace(/\[\d+\]/g, "")
    .replace(/`([^`]+)`/g, "$1");
}
