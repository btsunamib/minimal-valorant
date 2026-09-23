# Voxel Strike

无畏契约 Ascent 建筑风格参考重建的浏览器单人 FPS（保留原项目名 Voxel Strike），包含人机对战、爆破/团队/本地排位、触屏布局、陀螺仪和武器预览。

在线版本：https://voxel-strike-peter.tsunami111.chatgpt.site （访问权限由原站点设置决定）

## 本地运行

需要 Node.js 18 或更新版本，无需安装第三方 npm 依赖：

```sh
npm run dev
```

打开 http://localhost:4173 。请使用 HTTP 服务打开，不要直接双击 HTML。手机访问电脑的局域网地址可测试触屏；陀螺仪在部分浏览器需要 HTTPS 和设备权限。高帧率选项受屏幕、浏览器和设备性能限制。

```sh
npm test
```

## 源码目录

- `dist/`：直接运行的 HTML、CSS、JavaScript 源码，以及 Three.js、音效；不是只有编译产物。
- `tests/`：游戏逻辑和输入回归测试。
- `docs/`：参考来源、实现记录、截图和已知限制。
- `work-in-progress/agents/`：尚未完整接入游戏的角色系统代码和素材，不代表在线版本已完成这些角色。
- `skills/recreate-fps-weapons/`：可移植的枪械/刀具逐帧还原 skill、逐帧提取与误差检查脚本。
- `scripts/sync-github.mjs`：通过 Git 同步已提交源码并验证远端提交。

## 还原状态

场景已由苔藓方块风格改为灰泥立面、红瓦屋顶、拱门、绿色金属掩体与悬浮城市远景；详见 `docs/ascent-art-direction.md`。这是风格重建，并非 Ascent 地图 1:1 复制。

现有武器包含手工重建模型及插值动作，不是原游戏完整模型/骨骼数据。泷吟双形态、混沌序曲换弹等已实现，但尚未完成全部原视频帧的几何、材质、特效和声音一致性验收。部分连杀提示由同一采样变调重建，爆头提示为合成音效；详见对应参考文档。

新增 skill 要求完整动作清单、每帧证据和误差验收，不能仅凭“有逐帧播放按钮”宣称完美复刻。它不会自动把现有实现变成逐帧验收通过。

## 发布与 GitHub

GitHub 源码：https://github.com/btsunamib/minimal-valorant

用户要求：每次发布都提交并同步相应版本。流程见 `docs/publishing.md`，项目协作约定见 `AGENTS.md`。

源码包包含项目自有源码及本地使用素材；不包含 `.git` 历史、访问凭据、缓存或可重新下载的参考视频。参考来源链接保存在 `docs/`。第三方素材归各自权利人所有；Three.js 许可见 `dist/THREE-LICENSE.txt`。
