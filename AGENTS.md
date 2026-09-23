# Project instructions

- User language: Chinese. Continue this existing game and preserve unrelated work.
- Weapon modeling, animation, transformations, effects or feedback changes must follow `skills/recreate-fps-weapons/SKILL.md`.
- “逐帧还原” requires actual reference frames and complete measured comparisons. Existing hand-traced keys and reconstructed assets are not verified perfect replicas. Record remaining differences honestly.
- Preserve mobile multi-pointer movement + switching/inspection/reload, layout settings, orientation-correct gyro and browser gesture suppression.
- The user authorizes version-control commits and GitHub synchronization with each release. Before publishing: complete applicable tests, commit exact source, sync the configured GitHub repository, and verify remote HEAD. Never force-push or overwrite unrelated work.
- GitHub target: `btsunamib/minimal-valorant`, branch `main`, remote `github`. The user explicitly selected this repository. Sync every release using authenticated Git or the GitHub connector. For connector commits, preserve the previous remote parent, include `Source-Commit: <Sites SHA>` in the message, and verify every tracked path/blob SHA against the release tree. This is a required release step, not a background scheduler.
- Keep the existing Sites `origin`, project binding and access settings. A GitHub remote is additional; GitHub source synchronization does not authorize changing the site's hosting or visibility.
- Use the Sites hosting workflow for site deployments. Record the deployed source commit and successful deployment. If GitHub sync is blocked, explicitly report the blocker and pending commit instead of silently claiming completion.
