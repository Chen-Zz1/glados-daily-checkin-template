# GLaDOS Daily Check-in

每天由 Cloudflare Worker 自动执行 GLaDOS 签到。支持签到成功、今日已签到、Cookie 失效或请求失败的 Server酱微信通知。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Chen-Zz1/glados-daily-checkin-template)

## 配置

- `GLADOS_COOKIE`：必填。登录 GLaDOS 后，从签到请求中复制完整 Cookie。
- `SERVERCHAN_SENDKEY`：可选。填写 Server酱 SendKey 后接收微信通知。

部署页面会提示你填写这些 Secret。它们保存在你自己的 Cloudflare 账号中，不会发送给本仓库作者或引导网站。

## 执行时间

默认 Cron 为 `17 1 * * *`（UTC），即北京时间每天 09:17。Cloudflare 定时任务可能有数分钟延迟。

## 本地测试

```bash
npm install
cp .dev.vars.example .dev.vars
npm test
npm run dev
```

不要把包含真实 Cookie 或 SendKey 的 `.dev.vars` 提交到 Git。

## 免责声明

这是非官方开源工具，与 GLaDOS、Cloudflare、Server酱无隶属关系。请自行确认自动签到符合相关服务条款，并自行承担使用风险。
