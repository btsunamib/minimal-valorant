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

武器包含直接导入的 ValStrike 原始模型/骨骼帧，以及尚未取得原始模型的手工重建武器。混沌序曲、塑水宗、威龙使用各自独立击杀采样，爆头提示仍为现有合成音效。尚未完成全部原游戏视频帧的几何、材质、特效和声音一致性验收；详见对应参考文档。

新增 skill 要求完整动作清单、每帧证据和误差验收，不能仅凭“有逐帧播放按钮”宣称完美复刻。它不会自动把现有实现变成逐帧验收通过。

## 发布与 GitHub

GitHub 源码：https://github.com/btsunamib/minimal-valorant

用户要求：每次发布都提交并同步相应版本。流程见 `docs/publishing.md`，项目协作约定见 `AGENTS.md`。

源码包包含项目自有源码及本地使用素材；不包含 `.git` 历史、访问凭据、缓存或可重新下载的参考视频。参考来源链接保存在 `docs/`。第三方素材归各自权利人所有；Three.js 许可见 `dist/THREE-LICENSE.txt`。

### Five-agent release
Playable Jett, Sage, Sova, Phoenix and Raze with C/Q/E/X skills, a lobby picker, normal humanoid proportions and reconstructed cast gestures. Gun draw runs at 1.3× in matches. See `docs/five-agents.md` for scope and fidelity limitations.

### 用户资源包导入

五套 ValStrike 资源现已直接接入：2021 冠军狂徒/爪刀、2024 冠军战刀、黑波之刃和塑水宗狂徒（15 个模型变体）。在武器库选择皮肤/刀后，可查看所有原始动作，原速/慢放、逐帧前后拖动。模型帧与事件来自原始 MDL；缺少的手部贴图用当前角色材质适配。详细来源、缺项与验证见 `docs/imported-weapons-update.md`。开发验证使用 `npm test` 与 `npm run check:integration`。

### 扩展资源与皮肤选择（2026-10-03）

十个新资源包新增 28 组皮肤、85 个模型/配色版本，累计 100 个原始视模。VCT 标配含 44 款（包括通用款）。武器详情改为大幅模型、真实模型缩略图、配色/等级和独立装备按钮；每把枪分别保存皮肤，浏览不会立即装备。手机竖屏为底部横向列表，动作预览集中在可展开面板。新增塑水宗/威龙原始五段击杀音乐及包内徽章图层。资源、兼容处理、验证与限制见 `docs/collection-update.md`。

导入视模现在从 GitHub 的固定资源提交按需下载，需要网络；原始文件仍保存在源码中。加载有进度、超时重试和原对局重试入口，附加音效配置失败不会丢弃模型。详见 `docs/github-model-loading.md`。

### 地图、视模与渲染扩展（2026-10-03）

新增的 19 个资源包已接入：6 张可选地图、35 组武器／刀具（55 个可装备变体）、6 个瞄准视模、安装／拆除装置模型、50 张 HUD／触屏素材和 5 套分层击杀徽章及原包音效。默认枪械使用 ValStrike 视模；2025 冠军狂徒支持 Source 49 骨骼动画。累计 155 个可装备原始模型变体。武器库可预览，游戏设置可切换击杀徽章。

地图使用包内 BSP 几何、烘焙光照、天空盒和静态 MDL 道具，移动与机器人寻路跟随多层地面。动态武器使用渐变漫反射、材质高光与原始光效贴图。部分地图缺少外置 WAD；这些表面使用重建材质。本次按用户要求自由实现，未进行端游逐帧一致性验收。资源对应表、转换命令和具体限制见 [本次更新说明](docs/october-world-update.md)。

技能、出生点、地图机关和默认击杀徽章的本次修复及还原范围见 [技能与地图机制修复](docs/tactical-gameplay-restoration.md)。技能模型和动作属于重建，尚未完成原版所有参考帧的测量验证。
