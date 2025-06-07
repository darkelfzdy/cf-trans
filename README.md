# Cloudflare Pages + Google Gemini 翻译网站

这是一个基于 Cloudflare Pages 和 Google Gemini API 构建的在线翻译应用程序。前端使用 Vue 3 + TypeScript + Vite 构建，后端通过 Cloudflare Pages Functions 调用 Gemini API 进行翻译。

## 项目描述

本项目旨在提供一个简单易用的界面，让用户可以输入文本并获得由 Google Gemini 模型提供的翻译结果。它利用 Cloudflare Pages 进行全球部署，并通过 Cloudflare Pages Functions 实现后端逻辑。

## 本地开发说明

按照以下步骤在本地设置和运行项目：

### 1. 设置环境变量

对于本地开发，`GEMINI_MODEL_NAME`、`AI_GATEWAY_URL` 和 `GOOGLE_AI_API_KEY` **全部都必须在项目根目录下的 `.env` 文件中进行设置**。

1.  **创建 `.env` 文件:**
    *   从 [`.env.example`](./.env.example:1) 复制一份并重命名为 `.env`。
    *   `.env` 文件已被列入 [`.gitignore`](./.gitignore:1)，不会提交到版本库。

2.  **配置变量:**
    *   在 `.env` 文件中填入以下所有变量的值：
        *   `GOOGLE_AI_API_KEY`: 您的 Google AI API 密钥。
        *   `GEMINI_MODEL_NAME`: 您希望使用的 Gemini 模型名称 (例如 `gemini-pro`)。
        *   `AI_GATEWAY_URL`: 您的 Cloudflare AI Gateway 的 URL。

    *   一个清晰的 `.env` 文件内容示例如下：
        ```
        # .env (本地开发环境变量 - 不要提交到版本库)
        GOOGLE_AI_API_KEY=YOUR_ACTUAL_GOOGLE_AI_API_KEY
        GEMINI_MODEL_NAME=gemini-pro
        AI_GATEWAY_URL=YOUR_ACTUAL_CLOUDFLARE_AI_GATEWAY_URL
        ```

`wrangler` (通过 `npm run pages:dev` 运行时) 会自动加载 `.env` 文件中的环境变量。

### 2. 启动后端服务 (Cloudflare Pages Functions)

您可以使用 `wrangler` 来本地运行 Pages Functions。

```bash
npm run pages:dev
```

后端服务通常会启动在 `http://localhost:8788`。

### 3. 启动前端开发服务器

在新的终端窗口中，运行以下命令来启动 Vite 前端开发服务器：

```bash
npm run dev
```

前端应用通常会运行在 `http://localhost:5173`。

### 4. 确认代理配置

确保 [`vite.config.ts`](./vite.config.ts:1) 文件中的 `server.proxy` 配置的目标端口与您后端服务 (例如 `wrangler dev`) 实际运行的端口 (`http://localhost:8788`) 一致。

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
6.  **添加环境变量和 Secrets:**
    *   部署完成后（或在初始设置的 "Environment variables (advanced)" 部分），导航到您的 Pages 项目的 "Settings" -> "Environment variables"。
    *   **`GOOGLE_AI_API_KEY` (Secret):**
        *   点击 "Add variable"。
        *   输入变量名称 `GOOGLE_AI_API_KEY`。
        *   输入您的实际 Google AI API 密钥作为值。
        *   **重要:** 点击 "Encrypt" 按钮（或选择 "Secret" 类型，具体UI可能略有不同）将此变量标记为 Secret。保存更改。这确保了您的 API 密钥被安全地加密存储。
    *   **`GEMINI_MODEL_NAME` (普通文本变量):**
        *   点击 "Add variable"。
        *   输入变量名称 `GEMINI_MODEL_NAME`。
        *   输入您希望在生产环境使用的模型名称 (例如 `gemini-pro` 或 `gemini-1.5-flash-latest`)。
        *   **不要**加密此变量。保存更改。
    *   **`AI_GATEWAY_URL` (普通文本变量):**
        *   点击 "Add variable"。
        *   输入变量名称 `AI_GATEWAY_URL`。
        *   输入您在 Cloudflare 上配置的 AI Gateway 的完整 URL。
        *   **不要**加密此变量。保存更改。
    *   **说明:**
        *   Cloudflare Pages 会使用在 UI 中明确设置的这些环境变量。
        *   对于 Secrets (如 `GOOGLE_AI_API_KEY`)，它们**必须**通过 Cloudflare Pages UI 进行设置和加密。
    *   **(可选) Node.js 版本:**
        *   如果需要指定特定的 Node.js 版本，您可以在 "Settings" -> "Environment variables" 中添加一个名为 `NODE_VERSION` 的环境变量，并设置所需版本 (例如 `20`)。或者，也可以在 [`wrangler.toml`](./wrangler.toml:1) 的 `[vars]` 中设置 `NODE_VERSION`，但 UI 设置通常优先。

    **提示:** Cloudflare Pages 允许您为 "Production" 和 "Preview" 环境分别设置环境变量和 Secrets。请确保为 "Production" 环境正确配置了所有必需的值。

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
