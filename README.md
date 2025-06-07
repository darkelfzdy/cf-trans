# Cloudflare Pages + Google Gemini 翻译网站

这是一个基于 Cloudflare Pages 和 Google Gemini API 构建的在线翻译应用程序。前端使用 Vue 3 + TypeScript + Vite 构建，后端通过 Cloudflare Pages Functions 调用 Gemini API 进行翻译。

## 项目描述

本项目旨在提供一个简单易用的界面，让用户可以输入文本并获得由 Google Gemini 模型提供的翻译结果。它利用 Cloudflare Pages 进行全球部署，并通过 Cloudflare Pages Functions 实现后端逻辑。

## 本地开发说明

项目包含一个 `wrangler.toml` 文件，用于配置 `wrangler` CLI，特别是在本地使用 `wrangler pages dev` 命令运行和测试Pages Functions时。构建输出目录配置为 `dist`。

按照以下步骤在本地设置和运行项目：

### 1. 设置环境变量

首先，复制环境变量示例文件：

```bash
cp .env.example .env
```

然后，编辑 `.env` 文件，填入您的实际值，特别是 `GOOGLE_GEMINI_API_KEY`。

```
# .env
GOOGLE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Cloudflare Pages AI Gateway (可选, 如果你配置了AI Gateway)
# CF_PAGES_AI_GATEWAY="YOUR_AI_GATEWAY_URL"
```

### 2. 启动后端服务 (Cloudflare Pages Functions)

您可以使用 `wrangler` 来本地运行 Pages Functions。一个通用的启动命令示例如下：

```bash
npm run pages:dev
```

或者，如果您需要更精细的控制或项目中的 `package.json` 脚本不同，您可能需要使用类似以下的命令：

```bash
npx wrangler pages dev dist --do=CF_PAGES_AI_GATEWAY=http://localhost:8788
```

**注意:**
*   请检查您的 [`package.json`](./package.json:1) 文件中是否有为本地 Pages Functions 开发配置的特定脚本 (例如 `pages:dev` 或类似名称)。
*   上述 `npx wrangler pages dev dist` 命令中的 `dist` 是前端静态资源的输出目录，这与 `wrangler.toml` 中的 `pages_build_output_dir = "dist"` 配置一致。此命令用于在本地模拟 Cloudflare Pages 环境，同时提供静态资源和运行 Pages Functions。
*   `--do=CF_PAGES_AI_GATEWAY=http://localhost:8788` 是一个示例，用于将名为 `CF_PAGES_AI_GATEWAY` 的 Durable Object 绑定指向本地开发服务器的特定端口。如果您的项目不使用此特定绑定或以不同方式配置，请相应调整。

后端服务通常会启动在 `http://localhost:8788` (这是 `wrangler` 的默认端口之一，但也可能不同)。

### 3. 启动前端开发服务器

在新的终端窗口中，运行以下命令来启动 Vite 前端开发服务器：

```bash
npm run dev
```

前端应用通常会运行在 `http://localhost:5173` (Vite 的默认端口)。

### 4. 确认代理配置

确保 [`vite.config.ts`](./vite.config.ts:1) 文件中的 `server.proxy` 配置的目标端口与您后端服务 (例如 `wrangler dev`) 实际运行的端口一致。默认配置为 `http://localhost:8788`。如果您的后端服务运行在不同端口，请相应修改 [`vite.config.ts`](./vite.config.ts:1)。

## 构建命令

要为生产环境构建项目，请运行：

```bash
npm run build
```

这将会在 `dist` 目录下生成静态文件和 Pages Functions。

## 部署到 Cloudflare Pages

本项目设计用于轻松部署到 Cloudflare Pages。

1.  **准备您的代码仓库:**
    *   确保您的项目代码已推送到 GitHub (或其他 Cloudflare Pages 支持的代码托管平台) 仓库。

2.  **登录 Cloudflare 仪表盘:**
    *   访问 [Cloudflare 仪表盘](https://dash.cloudflare.com/) 并登录您的账户。

3.  **创建新的 Pages 项目:**
    *   导航到 "Workers & Pages" 部分。
    *   点击 "Create application"，然后选择 "Pages" 标签页。
    *   点击 "Connect to Git"。

4.  **连接您的 Git 提供商:**
    *   选择您的 Git 提供商 (例如 GitHub) 并授权 Cloudflare 访问您的仓库。
    *   选择包含此项目的仓库。

5.  **配置构建和部署设置:**
    *   **项目名称:** Cloudflare 会根据您的仓库名称自动填充，您可以按需修改。
    *   **生产分支:** 选择您希望部署的分支 (例如 `main` 或 `master`)。
    *   **框架预设:** 选择 "Vite"。Cloudflare 通常能正确识别 Vite 项目。
    *   **构建命令:** 确保此项设置为 `npm run build` (或您在 `package.json` 中定义的构建脚本)。
    *   **构建输出目录:** 确保此项设置为 `dist`。
    *   **根目录 (高级):** 通常留空，除非您的项目不在仓库的根目录。

6.  **添加环境变量 (重要):**
    *   在 "Environment variables (advanced)" 部分，点击 "Add variable" 为生产环境添加以下变量。这些变量对于后端 Functions 的正常运行至关重要。
    *   `GOOGLE_AI_API_KEY`: 您的 Google AI API 密钥。**请务必勾选 "Encrypt" 将其标记为机密值。**
    *   `GEMINI_MODEL_NAME`: 您希望使用的 Gemini 模型名称 (例如 `gemini-pro`，根据您的 [`.env.example`](./.env.example:1) 或PRD)。
    *   `AI_GATEWAY_URL`: 您的 Cloudflare AI Gateway 的 URL。
    *   (可选) 您可能还需要为 Node.js 版本设置一个环境变量，例如 `NODE_VERSION`，设置为一个与您本地开发环境兼容的 LTS 版本 (例如 `18` 或 `20`)，如果 Cloudflare 的默认版本不适用。

7.  **保存并部署:**
    *   点击 "Save and Deploy"。
    *   Cloudflare Pages 将开始构建和部署您的应用程序。您可以在仪表盘中查看部署日志和状态。
    *   部署成功后，您将获得一个 `*.pages.dev` 的 URL，您的翻译网站将在此上线。

8.  **自定义域名 (可选):**
    *   部署成功后，您可以在 Pages 项目的 "Custom domains" 标签页中设置自定义域名。

---

*原始模板信息 (Vue 3 + TypeScript + Vite):*

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
