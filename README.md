# home_kb · 家庭物品知识库助手

个人用的「说明书 + 购买凭证」问答助手（RAG + 结构化台账）。

```
home_kb/
├─ docker-compose.yml   # 本地 Postgres + pgvector
├─ .env.example         # 全部配置项
├─ frontend/            # Next.js（App Router + Tailwind），部署到 Vercel
├─ backend/             # FastAPI 骨架（尚未实现）
├─ notebooks/           # Phase 0 实验
└─ scripts/             # 备份、批量导入、重建索引
```

## 前端

```bash
cd frontend && npm install && npm run dev
```

后端未就绪时，`NEXT_PUBLIC_USE_MOCK=1`（默认）使用内置示例数据；接入后端后改为 `0` 并设置 `NEXT_PUBLIC_API_BASE_URL`。

页面：`/` 问答首页 · `/chat` 对话 · `/upload` 上传入库 · `/ledger` 物品台账（含购买与保修表单）。
宽屏（≥768px）为顶部导航 + 表格，窄屏为底部标签栏 + 卡片。
