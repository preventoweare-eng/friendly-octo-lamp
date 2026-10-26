# Tracework · 研究工作台

面向设计的主动式设计研究工作台 MVP。当前版本使用本地模拟数据演示完整流程：研究总览、资料与证据、洞察地图和机会报告。

## 本地运行

仓库没有运行时依赖，可直接在项目目录启动静态服务器：

```bash
python3 -m http.server 4173
```

然后打开 `http://127.0.0.1:4173`。后续接入真实搜索和 AI 服务时，再增加服务端 API 与环境变量。

## GitHub Pages

仓库包含 `.github/workflows/pages.yml`。将 `main` 推送到 GitHub 后，Actions 会自动部署静态工作台；首次部署后可在仓库的 **Settings → Pages** 查看生成的访问地址。

## 真实搜索模式

GitHub Pages 只提供静态前端；要启用实时搜索，请在仓库目录启动内置 Node 服务：

```bash
node server.mjs
```

然后打开 `http://127.0.0.1:4173`。`/api/search` 默认使用 DuckDuckGo Instant Answer；如果设置 `TAVILY_API_KEY`，会优先使用 Tavily 并返回更多网页结果：

```bash
TAVILY_API_KEY=你的密钥 node server.mjs
```

搜索结果会带来源链接进入“资料与证据”，默认标记为“待审核”，不会直接被当作可靠洞察。生产部署时，应把 `server.mjs` 部署到支持 Node 的服务（例如 Vercel、Render 或 Cloudflare Workers），再将前端 API 地址配置为该后端地址；不要把搜索密钥写进前端代码或 GitHub Pages。
