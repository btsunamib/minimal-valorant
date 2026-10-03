# GitHub 模型加载修复（2026-10-03）

用户反馈新增的有模型皮肤在对局中加载不出来，随后明确要求改从 GitHub 下载。

## 已完成

- `weapon-assets.js` 将 `assets/imported/` 中的模型、动作音效配置、原始音效及导入特效图层统一指向公开仓库 `btsunamib/minimal-valorant` 的原始文件地址。资源固定到已同步的提交 `9f9a2a13fb80293f4b0b8cc3d85c86f430c0ecae`；本次没有修改任何资源文件，所以代码的新提交继续引用这份完整资源树。新增或修改素材时必须先同步资源提交，再更新这个版本号。
- 浏览器请求使用 CORS 和 `credentials: omit`；前端没有 GitHub Token。武器库缩略图仍使用随站点发布的小图片，实际视模来自 GitHub。
- 下载显示实际读取字节数或 Content-Length 对应的百分比。HTTP 失败、HTML/LFS 文本、下载不完整、超时会明确报错；自动重试一次，失败后可在原对局点击“重试加载”。
- GZIP 解压优先使用浏览器原生接口；接口存在但实际解码失败时，也会使用已有的 fflate 回退。原始 MDL、骨骼、模型和动画帧没有改变。
- 骨骼动作已在 MDL 内，额外 JSON 只负责匹配音效路径。音效配置下载失败不再丢弃有效模型，枪口附加配置也不会阻塞模型就绪。
- 等待或失败时显示明确加载状态与临时基础武器。皮肤网络状态不再冻结开火；成功后换成原始模型，重试不重置经济、弹药或对局。

## 现场检查与回归

- 旧线上威龙狂徒 MDL 及 sequences.json 经过授权请求均返回 200，说明已发布文件存在；不能据此断言用户设备的具体失败原因。
- GitHub 威龙狂徒原始文件返回 IDST 签名，响应带 `Access-Control-Allow-Origin: *`。EDG 压缩模型完整返回 200，解压后逐字节等于仓库中的原始 MDL。
- `tests/weapon-loading.test.mjs` 覆盖固定公开地址、无凭据请求、自动重试、真实字节进度、HTML/不完整模型、超时/取消、有接口但不能解压的 WebView、额外配置失败不丢弃模型以及失败后重试。
- `check-collection.mjs` 除全部新增模型的原始动作外，现在还走真实的“武器库装备 → 返回大厅 → 开局标配 → 切刀 → 商店买鬼魅”流程，检查保留各枪皮肤。另模拟 GitHub 503，验证失败提示、临时几何、仍能开火与原对局重试，弹药不丢失。
- DOM/Canvas 回归使用模拟环境，没有用户手机 GPU 或浏览器现场验收，不能把这些测试称为真机显示问题已经全部排除。

GitHub 原始文件下载参考：[GitHub 官方下载说明](https://docs.github.com/en/repositories/working-with-files/using-files/downloading-files-from-github)、[仓库内容接口中的 download_url](https://docs.github.com/en/rest/repos/contents)。
