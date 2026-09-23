# 每次发布对应源码提交

用户要求：每次发布都提交到自己的 GitHub。此要求持续适用。

## 当前连接状态

- GitHub 账号：`btsunamib`。
- 用户指定的游戏仓库：https://github.com/btsunamib/minimal-valorant ，分支 `main`，独立 remote 名称 `github`。
- 2026-09-23：连接器写入曾返回 HTTP 403；随后用户提供临时 GitHub 凭据完成 Git 认证。临时凭据不保存，用户会撤销；后续发布仍需要有效的 Git 写入认证或恢复连接器写权限。
- 每次发布必须同步；没有常驻后台任务，执行发布的开发者/agent 必须完成此步骤。
- 已有 Sites 源码远端必须保留，不能替换其 `origin`。
- 最近游戏版本：`8c8232020e5685bb5fb9d85eeb5b25da18cb0530`，对应泷吟、混沌换弹与战斗音效更新。

## 连接方式

已有 Sites 的 `origin` 保留。额外 remote：

```sh
git remote add github https://github.com/btsunamib/minimal-valorant.git
```

首次导入通过正常 Git 合并连接 Sites 历史与 GitHub 初始化历史，保留原始 README 初始化提交，以项目完整 README 替代其占位内容。此后优先用经过认证的 Git 同步，让两个远端保有同一发布提交。

若改用已恢复写权限的 GitHub 连接器，每次读取 `main` 最新提交，以其为父提交，上传改变的 blob，生成完整源码树，非强制更新分支并核对每个文件的 Git blob SHA。提交信息记录 `Source-Commit: <Sites SHA>`；这种方式可能使两个平台的提交 SHA 不同。

有 Git 命令行认证且两个远端历史兼容时，可使用同步脚本。若通过连接器创建了独立提交，不能直接强推 Sites 历史；继续使用连接器，或先正常合并历史。

Git 身份验证使用平台连接或安全凭据工具，不能把 token 写入源码、URL 或 ZIP。

## 每次发布

1. 完成改动与必要测试；武器更新附上动作证据及未还原项。
2. 提交完整源码。通过 Sites 的发布流程保存其源码分支，确认最终 release SHA。
3. 用有效 Git 认证运行 `node scripts/sync-github.mjs github main`，推送并核对远端 SHA。没有 Git 凭据时，可用已具备写权限的连接器同步并验证文件树。脚本不创建仓库、不自动提交修改、不强推。
4. GitHub 未配置、权限失败或远端历史冲突时停止同步，明确告知阻塞。用户明确接受临时只发布站点时，记录待补同步版本。
5. 部署该提交对应的构建，验证部署成功，再给出游戏地址与 GitHub 提交链接。

如果只能通过 GitHub 连接器写入文件，提交树应包含完整源码，保留远端已有历史；记录 Sites SHA 与 GitHub SHA 的映射，并验证源文件内容一致，不能把文件上传成功当作整个版本同步成功。
