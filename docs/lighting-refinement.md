# 地图光影细化 · 2026-10-05

缓存版本：`20261005-lighting2`。前一版代码：`839f612`。

参考 Riot 的技术文章和地图美术说明，将地图原有烘焙颜色作为主光照，补充局部遮蔽、天空光和受限的冷暖变化。原始 BSP、导航、贴图、顶点颜色及模型动作均保留。

六张地图各自设置主光方向、受光色、背光色和远景雾。日落之城使用暖色主光与偏紫的背光；深海遗珠使用冷色天空光；微风岛屿、莲华古城和裂变峡谷采用各自的海岛或植被环境色。实际阴影光源跟随同一方向，切图时一起更新。

`scripts/bake-map-lighting.py` 使用原始静态 BSP 的精确线段相交，离线计算接触遮蔽、天空开放程度和局部太阳可见性。接触暗化最多 22%；天空和太阳射线限制在局部 14 米范围，避免原导入数据保留的远端隐形封口成为整张地图的遮光顶盖。结果通过顶点插值叠加，是有限采样的近似，细节精度取决于原始三角网格。

光照附加文件共 287,369 字节，按当前地图单独读取。每个顶点增加 3 字节归一化属性，不增加地图三角形、绘制对象、纹理采样或全屏 AO 通道。流畅画质保留该烘焙层，均衡和精细继续使用现有阴影预算。文件缺失或损坏时回退到原始烘焙光照。

墙面保持哑光。玻璃、水面和金属按原贴图名称添加受限的视角高光；只有这些材质的着色器编译高光计算。亮部使用有限幅度压缩，室内保留间接光，避免提高灯光强度导致颜色泛白。

验证记录见 `docs/qa/lighting2/browser-validation.json` 和同目录截图：

- 136 项 Node 测试与离线 BSP 射线自检与全部现有集成回归通过，包括 130 条实际地图移动路线和 108 个 bot 场景。
- Chromium / SwiftShader WebGL 实际渲染六张地图、12 个机位，未出现 GLSL 编译错误。
- 亚海悬城、日落之城、深海遗珠保留同机位、同画质的前后画面对比。
- 流畅、均衡、精细档均加载烘焙属性；检查横屏尺寸及强制光照文件 404 的回退。
- 未测量实体手机的 GPU 耗时或高刷帧率。

离线射线自检命令为 `python scripts/bake-map-lighting.py --self-test`（需要 NumPy）。

可用 `scripts/check-map-lighting-browser.mjs` 重跑浏览器检查：安装 Playwright 或通过 `PLAYWRIGHT_MODULE` 指定模块，设置 `CHROME_BINARY`；`MINIVAL_QA_VARIANTS=1` 增加画质与下载回退检查。

参考资料：

- [Riot — VALORANT Shaders and Gameplay Clarity](https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity)：材质响应、环境 Lightmaps、间接光控制和画质缩放。
- [Riot 技术负责人 — VALORANT’s foundation is Unreal Engine](https://www.unrealengine.com/tech-blog/valorant-s-foundation-is-unreal-engine)：前向渲染、静态环境光照及低端 GPU 预算。
- [Riot — The Art of VALORANT Map Environments](https://playvalorant.com/en-gb/news/dev/the-art-of-valorant-map-environments/)：室内可读性、环境材质对比度和地图性能。
