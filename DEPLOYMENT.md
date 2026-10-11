# 构建、部署与回滚

## 独立静态模式

```sh
npm ci --ignore-scripts
npm run check
npm run build
npm run preview
```

发布 dist/ 到支持 SPA 的静态站点。所有非资产路径必须回退到 index.html，否则直接访问 /investments/:id 或 /expos/:id 会返回服务器 404。运行时没有后台健康检查接口；用 index.html 和真实页面烟测检查静态可用性。

子路径以 CLIENT_BASE_PATH=/vc-expo-intelligence/ 构建。资产、路由和分享链接采用同一 base。预览也保持该配置。GitHub Pages 默认缺少 SPA fallback，不能只上传 dist 就承诺详情直链可用；使用有 rewrite 的静态服务，或单独设计 Pages fallback。

Nginx 根路径最小配置（需按实际域名、HTTPS 和文件目录调整）：

```nginx
server {
    listen 80;
    root /var/www/vc-expo-intelligence;
    location / { try_files $uri $uri/ /index.html; }
    location /assets/ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    location = /index.html { add_header Cache-Control "no-cache"; }
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
```

这是配置示例，未执行实际部署或验证 Nginx。无服务端存储，因此不需要 Docker、数据库迁移或数据库备份。用户收藏和缓存留在浏览器，清理站点数据会删除收藏，没有跨设备备份。

## 妙搭平台模式

```sh
npm run build:platform
```

产物为 dist-platform/，保留虚拟 capability 注册、平台容器和原平台预设。按妙搭平台的当前发布流程上传/发布，使用平台最小插件权限。仅本地编译已验证，未操作用户生产环境；平台原始 HBS 元数据由平台发布过程处理。不得把静态产物当成能够执行实时能力的独立后端。

## 发布与回滚

发布前执行质量、安全、浏览器检查，审阅 CHANGELOG 和上游例外有效期。按审核的 Git 提交或 tag 保存 dist、锁文件及构建配置。部署新资产后最后更新 index.html，保留上一版资产用于回滚；失败时恢复上一构建的完整资产与 index。缓存 v4 可回滚读取 v3；旧版本不理解新内容身份，回滚到原版本会失去新收藏的绑定，需提前说明，不删除浏览器数据。

本轮没有自动发布工作流：CI 只检查并保存测试报告，避免自动改动生产环境。
