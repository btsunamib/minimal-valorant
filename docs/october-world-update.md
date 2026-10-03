# 2026-10-03 用户资源与世界更新

本次按用户明确要求不采用逐帧还原技能，直接扩展已有可玩项目。

## 资源落地

| 用户资源包 | 游戏用途 |
| --- | --- |
| Valstrkie皮肤(1) | 19 种默认枪械／刀具视模、6 个开镜视模、爆能器与拆除工具 |
| 刀（瓦）-塑水宗 | 4 款黑波之刃光效模型 |
| 钱包大招鸟狙模’带光效 | 4 款新边疆飞将模型；以实际模型内容命名 |
| 25冠军ak(泛光)(无检视)-By牢憨_sand | Source 49 冠军狂徒，92 骨骼、23 网格、327 动画帧；没有检视动作 |
| 亚海悬城、微风岛屿、日落之城、深海遗珠、莲华古城、裂变峡谷 | BSP 原始地图、嵌入贴图、烘焙光照、NAV 地面、静态 MDL 道具；地图选择器与小地图 |
| 瓦手ui | HUD 受伤／回合结果图像、触屏按钮图像；保留 50 张可调用素材 |
| 超时空护卫队 | 三棱军刺、狂徒、獠犬、鬼魅，原动作和 5 段击杀反馈 |
| 天界神兵整套（val） | 战刀、永恒之刃、遗落之境冥驹／狂徒、戍卫、飞将、幻影 |
| 起源喷 | 新版雄鹿视模、原始逐发换弹动作 |
| 22蝴蝶刀 | 新版冠军蝴蝶刀视模与原动作 |
| 天界神兵击杀图标val、奇点击杀图标（白）val、流脓击杀图标val、killbanner | 设置中可选的分层图像、爆头图标与 1–5 杀原始采样 |

新增 35 个武器条目、54 个 GoldSrc 可装备变体、1 个 Source 变体，共 155 个可装备原始模型变体。另有 6 个瞄准模型及 2 个装置模型。GoldSrc 文件采用无损 gzip，新增 MDL 下载体积从 151,765,096 降到 61,953,235 字节。

## 渲染与移动

- 保留地图嵌入贴图和 BSP 烘焙色彩；静态道具共享几何与贴图并用实例化绘制。
- 武器使用 Three.js 标准材质的高光和三段渐变漫反射，原有加色／透明光效保持独立。设计参考 [Riot：VALORANT Shaders and Gameplay Clarity](https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity)，并非原 UE 着色器移植。
- BSP 地板补足不完整 NAV，读取层高；出生点避开墙体与孤立屋顶。寻路目标显式携带楼层，避免把上下重叠区域当作同一平面。
- 碰撞使用 BSP 空间查询及竖直刷面边界，地图网格用于视线／射线命中。静态装饰 MDL 不作为移动碰撞体。
- 保留空岛街区、移动端多指操作、陀螺仪和原玩法。

## 转换与复现

解压原始资源后，在仓库根目录执行（需要 Python、Pillow、NumPy）：

```sh
python scripts/import-october-assets.py EXTRACTED_ARCHIVE_ROOT
python scripts/import-source-champions25.py SOURCE_CHAMPIONS_PACK_ROOT
python scripts/import-bsp-maps.py EXTRACTED_ARCHIVE_ROOT
python scripts/resolve-map-textures.py
python scripts/render-map-previews.py
node scripts/render-collection-thumbnails.mjs
python scripts/render-source-thumbnail.py
python scripts/compress-october-assets.py
npm test
npm run check:integration
```

Source 结构按 [Valve studio.h](https://github.com/ValveSoftware/source-sdk-2013/blob/master/src/public/studio.h) 和 [optimize.h](https://github.com/ValveSoftware/source-sdk-2013/blob/master/src/public/optimize.h) 解码。兼容 Source 分节动画、Quaternion48／64、RLE 通道、VVD 顶点权重、VTX 三角条带和 DXT1／DXT5。

资源原始相对路径、输出路径及校验值见 `october-resource-sources.json`；地图包来源与缺失贴图列表见 `map-import-report.json`。缺失 WAD 表面重建列表见 `map-texture-resolution.json`。原包作者及来源沿用用户提供资源，不冒充 Riot 官方资产。

## 实际验证和限制

自动验证涵盖每个视模的骨骼帧／事件／三角形、Source 全部 327 帧与蒙皮权重、六图出生点到所有爆破点的图路径、装置和瞄准视模读取、反馈图层／五段音频文件，以及现有装备、射击、换弹、重试、手机布局和输入回归。

这些地图是用户包内 GoldSrc 地图移植，不是完整 UE 端游地图。外置 WAD 未随包提供，248 个纹理条目使用重建纹理；原天空素材仅有五张地图具备完整六面。原始 NAV 中的跳跃、梯子、特殊穿越和门逻辑没有完整复刻；使用可步行连接，地图门以开放路线呈现。图路径测试不等于所有机器人路径都经真人跑图验收。Source 包没有检视，按原包保留；尚无端游画面对照误差验收。
