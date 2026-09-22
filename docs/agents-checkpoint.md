# Agent system work in progress

User requested normal Valorant-like body proportions and all agents, then asked to prioritize the knife and fixes for the first release. Agent files and 174 downloaded portrait/ability assets are saved in `work-in-progress/agents`. They are deliberately not imported or deployed yet.

- 29 agent definitions generated from the current zh-CN valorant-api roster, names checked against official playvalorant.com roster, 22 Sep 2026.
- Anatomical shared model generator uses 1.86 m / .24 m skull, 7.75 heads, individual silhouette accessories. Original factory has not yet been replaced in main.js.
- Skill runtime draft implements each declared local skill kind, with simplified targeting. NOT integrated or validated. Existing source descriptions must not be presented as proof of exact original gameplay.
- Next: integrate selection screen, C/Q/E/X skill HUD + custom-layout ultimate, player/bot kits, status effects and raycast hooks. Fix/review runtime: dispose turret child geometry/material, dead self-ultimate score attribution, wrong projectile LOS ternary, immunity/decay resets, deadline cancellation and collision behavior.
