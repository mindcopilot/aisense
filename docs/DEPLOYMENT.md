# Looma · 露玛 — 部署与使用文档

AI 商拍工作室：对话式出图、图像编辑、一图生视频、小红书生文、营销自动化。

---

## 1. 架构概览

Monorepo（npm workspaces），三个包：

| 包 | 说明 | 技术栈 |
| --- | --- | --- |
| `apps/web` | 前端单页应用 | Vite + React + TypeScript |
| `apps/api` | 后端 API + Temporal worker | Node + Express + TypeScript |
| `packages/shared` | 前后端共享的领域类型 | 纯 TypeScript，无运行时依赖 |

外部组件（均为可选，缺失时自动降级）：

- **PostgreSQL** — 业务数据存储。不可达时自动回退到内存数据库（pg-mem）。
- **Temporal** — 复杂流程编排（出图批次、营销流水线、定时触发）。不可达时回退到进程内执行。
- **Anthropic（Vercel AI SDK）** — 大模型调用。无 Key 时使用内置确定性兜底。
- **Langfuse** — 大模型调用观测。无 Key 时为无操作。

模块依赖只向内（routes → service → repository / llm / temporal），每个外部厂商隔离在单一模块中。

---

## 2. 环境要求

- **Node.js ≥ 20**
- npm ≥ 10（随 Node 提供）
- 可选：**Docker** 与 Docker Compose（用于本地拉起 PostgreSQL + Temporal）

---

## 3. 快速开始（零配置开发）

```bash
npm install
npm run dev
```

即可使用 —— 无需 Docker、无需 `.env`、无需手动迁移：

- 数据库自动回退到内存模式并自动建表 + 灌入演示数据；
- 无 `ANTHROPIC_API_KEY` 时，AI 使用确定性兜底，对话与生成照常可用；
- Temporal 不可达时，出图与营销流水线就地内联执行。

启动后访问：

- 前端：http://localhost:5173
- 后端：http://localhost:4000 （健康检查 `GET /health`）

> 内存数据库在进程重启后清空。需要持久化请按第 4 节启用 PostgreSQL。

---

## 4. 完整部署（PostgreSQL + Temporal）

```bash
# 1. 拉起基础设施
docker compose up -d            # PostgreSQL + Temporal + Temporal UI

# 2. 配置（可选填入 ANTHROPIC_API_KEY / LANGFUSE_*）
cp .env.example .env

# 3. 初始化数据库
npm run db:migrate              # 建表 + 演示数据

# 4. 启动全部进程
npm run dev:all                 # API + Temporal worker + web
```

Docker Compose 暴露的端口：

| 服务 | 端口 |
| --- | --- |
| PostgreSQL | 5432 |
| Temporal | 7233 |
| Temporal UI | 8233 |
| API | 4000 |
| Web（开发） | 5173 |

### 可用的 npm 脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 同时启动 API + web（零配置开发） |
| `npm run dev:all` | API + Temporal worker + web |
| `npm run dev:api` | 仅 API 服务 |
| `npm run dev:worker` | 仅 Temporal worker |
| `npm run dev:web` | 仅前端开发服务器 |
| `npm run db:migrate` | 对真实 PostgreSQL 建表 + 灌演示数据 |
| `npm run build` | 构建全部包 |
| `npm run typecheck` | 全工程类型检查 |

---

## 5. 环境变量

全部变量见 `.env.example`，均有合理默认值，可直接零配置运行。

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `4000` | API 监听端口 |
| `NODE_ENV` | `development` | 运行环境 |
| `DATABASE_URL` | `postgres://looma:looma@localhost:5432/looma` | PostgreSQL 连接串；不可达时回退内存库 |
| `TEMPORAL_ADDRESS` | `localhost:7233` | Temporal 服务地址 |
| `TEMPORAL_NAMESPACE` | `default` | Temporal 命名空间 |
| `TEMPORAL_TASK_QUEUE` | `looma-photoshoot` | 任务队列名 |
| `ANTHROPIC_API_KEY` | （空） | 留空则使用内置兜底 |
| `LLM_CHAT_MODEL` | `claude-sonnet-4-6` | 推理模型 |
| `LLM_FAST_MODEL` | `claude-haiku-4-5-20251001` | 快速模型 |
| `LLM_IMAGE_MODEL` | `looma-director-v3` | 图像模型标识（当前为模拟） |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` | （空） | 同时填写才启用观测 |
| `LANGFUSE_BASE_URL` | `https://cloud.langfuse.com` | Langfuse 地址 |
| `VITE_API_BASE_URL` | `http://localhost:4000` | 前端访问的 API 地址 |

---

## 6. 模型配置

所有模型集中在 `apps/api/src/llm/models.ts`，由 `config.ts` 注入：

| 用途 | 环境变量 | 默认 |
| --- | --- | --- |
| AI 艺术总监 / 写手 / 营销策划 | `LLM_CHAT_MODEL` | `claude-sonnet-4-6` |
| 快速工具调用 | `LLM_FAST_MODEL` | `claude-haiku-4-5-20251001` |
| 图像渲染（模拟） | `LLM_IMAGE_MODEL` | `looma-director-v3` |

更换模型只需改环境变量；接入真实图像 / 视频模型时，在 `temporal/activities.ts` 与
`temporal/campaignActivities.ts` 的渲染活动中替换模拟实现即可。

---

## 7. 生产构建与部署

```bash
npm run build
```

产物：

- 前端：`apps/web/dist/` —— 纯静态文件，交给 Nginx / 对象存储 / CDN 托管。
- 后端：`apps/api/dist/` —— 编译后的 Node 代码。

启动后端（需配置好 `.env` 指向生产 PostgreSQL / Temporal）：

```bash
npm run start --workspace apps/api          # API 服务（node dist/server.js）
npm run start:worker --workspace apps/api   # Temporal worker（node dist/worker.js）
```

部署要点：

- 前端构建前通过 `VITE_API_BASE_URL` 指定生产 API 地址。
- API 与 worker 建议作为两个独立进程 / 容器常驻（用 systemd、PM2 或 K8s）。
- API 启动时自动执行建表与演示数据灌入，幂等可重复运行。
- 若使用 Temporal Schedules 实现定时触发，worker 必须常驻；否则定时任务回退为 API 进程内定时器（API 重启后会自动重新挂载）。

---

## 8. 功能使用指南

左侧导航在七个视图间切换：

| 视图 | 用途 |
| --- | --- |
| **灵感** | 杂志式工作台：项目入口、进行中项目、编辑精选与灵感配方。 |
| **工作室** | 核心。左侧与 AI 艺术总监 Atelier 对话，右侧无限画布展示生成结果，可拖拽 / 缩放（Ctrl+滚轮）。 |
| **编辑器** | 图像编辑：抠图、重打光、换背景、扩图、魔法消除，带图层与历史。 |
| **视频** | 一图生成短视频：分镜、配乐、时间轴。 |
| **生文** | 生成符合小红书规范的笔记，见下。 |
| **营销** | 一句话营销自动化流水线，见下。 |
| **素材库** | 已生成素材的瀑布流浏览。 |

### 工作室

1. 进入「工作室」，在左侧对话框描述需求（如「上传亚麻衬衫，要春季温柔感，东方面孔模特」）。
2. Atelier 给出 2-3 个创意方向，或直接规划一个出图批次。
3. 生成结果出现在右侧画布上，可拖动比较；选中卡片弹出浮动工具条（重打光 / 换背景 / 扩图等）。

### 生文（小红书）

1. 选择**内容领域**：电商种草 / AI·科技。
2. AI·科技领域下再选**内容体裁**：教程实操 / 工具测评 / 资讯快讯 / 深度观点。
3. 填写主题与卖点、选择语气，点击生成。
4. 右侧展示笔记，并实时做小红书规范校验：标题 8–20 字、正文 120–1000 字、话题标签 3–10 个、绝对化用语 / 违禁词标红。

### 营销自动化

1. 在「营销」视图输入**一句话宣传需求**。
2. 点击「立即生成」，流水线自动产出：宣传图片 → 短视频分镜 → 配套文章。
3. 如需**定期触发**，设置间隔分钟数并「创建定时任务」：
   - Temporal 可用时由 Temporal Schedule 驱动；
   - 否则由 API 进程内定时器驱动（API 重启后自动恢复）。
4. 任务卡片实时显示状态（拆解需求 → 生成物料 → 已完成）及全部产出物料。

---

## 9. API 参考

基础路径 `http://<host>:4000`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/health` | 健康检查 |
| GET | `/api/projects` | 项目列表 |
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects/:id` | 项目详情（含画布与对话） |
| GET | `/api/studio/:projectId/thread` | 工作室对话记录 |
| POST | `/api/studio/:projectId/messages` | 发送消息（触发 AI 与出图） |
| GET | `/api/content/spec` | 小红书规范与领域 / 体裁清单 |
| GET | `/api/content/:projectId/posts` | 已生成笔记列表 |
| POST | `/api/content/:projectId/posts` | 生成一篇笔记 |
| GET | `/api/marketing/campaigns` | 营销任务列表 |
| POST | `/api/marketing/campaigns` | 触发一次营销流水线 |
| GET | `/api/marketing/campaigns/:id` | 营销任务详情 |
| GET | `/api/marketing/schedules` | 定时任务列表 |
| POST | `/api/marketing/schedules` | 创建定时任务 |
| DELETE | `/api/marketing/schedules/:id` | 停用定时任务 |

---

## 10. 运维

- **Temporal UI**：http://localhost:8233 查看工作流与 Schedule 执行情况。
- **Langfuse**：配置 Key 后，所有大模型调用（艺术总监、写手、营销策划）会上报 trace，可在 Langfuse 控制台查看输入 / 输出 / token 用量。
- **数据库**：生产环境务必使用真实 PostgreSQL（`DATABASE_URL`），内存模式仅用于演示。

### 常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 日志出现「PostgreSQL unreachable — using in-memory database」 | 未连接真实数据库，属正常降级；需持久化请启动 PostgreSQL 并配置 `DATABASE_URL`。 |
| 日志出现「could not start workflow / schedule, falling back」 | Temporal 不可达，已回退内联 / 进程内执行；需要持久编排请启动 Temporal 并运行 worker。 |
| AI 回复较模板化 | 未配置 `ANTHROPIC_API_KEY`，正在使用内置兜底；填入 Key 即启用真实模型。 |
| 前端请求失败 | 检查 `VITE_API_BASE_URL` 是否指向正确的 API 地址，以及 API 是否已启动。 |
