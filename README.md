# 蓝车赛车沙盒

一个基于 Three.js 的浏览器赛车 MVP，使用 `SU7_Kart_LowPoly.glb` 蓝车模型。车辆会沿道路前进，可在车道内左右移动；道路两侧设有隐形边界。

[在线试玩](https://blue-kart-racing.wangyiling0727.chatgpt.site/)

## 本地运行

需要 Node.js 与 pnpm：

```bash
pnpm install
pnpm dev
```

打开终端显示的本地地址。执行 `pnpm build` 可生成静态文件到 `dist/`。

## 操作

- W / ↑：沿道路前进；S / ↓：刹车或倒车
- A / ←、D / →：在车道内移动
- 空格：快速侧移；Shift / L：加速；J：跳跃
- C：切换镜头；P：暂停；R / T：重置；F：全屏；H：帮助

蓝车模型由项目使用者提供。项目未附带模型的再授权声明。
