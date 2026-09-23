# Project instructions

- User language: Chinese. Continue this existing game and preserve unrelated work.
- Weapon modeling, animation, transformations, effects or feedback changes must follow `skills/recreate-fps-weapons/SKILL.md`.
- “逐帧还原” requires actual reference frames and complete measured comparisons. Existing hand-traced keys and reconstructed assets are not verified perfect replicas. Record remaining differences honestly.
- Preserve mobile multi-pointer movement + switching/inspection/reload, layout settings, orientation-correct gyro and browser gesture suppression.
- The user authorizes version-control commits and GitHub synchronization with each release. Before publishing: complete applicable tests, commit exact source, sync the configured GitHub repository, and verify remote HEAD. Never force-push or overwrite unrelated work.
- GitHub target is currently NOT configured. Do not guess an unrelated repository. Resolve/create a dedicated user-owned repository, then document its URL and branch in `docs/publishing.md` and add a `github` remote. Do not claim automatic sync until verified.
- Keep the existing Sites `origin`, project binding and access settings. A GitHub remote is additional; GitHub source synchronization does not authorize changing the site's hosting or visibility.
- Use the Sites hosting workflow for site deployments. Record the deployed source commit and successful deployment. If GitHub sync is blocked, explicitly report the blocker and pending commit instead of silently claiming completion.
