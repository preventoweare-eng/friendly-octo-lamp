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
