# Kuronami no Yaiba reconstruction

Reference review: 22 September 2026.

- https://valorantinfo.com/weapons/melee/kuronami-no-yaiba
- https://wiki.playvalorant.com/en-us/Kuronami_Collection
- https://media.esports.gg/uploads/2024/01/Kuronami-Melee-1568x882.jpg
- Upgraded animation video linked on ValorantInfo: /videos/levels/f478ae7c-427d-bf16-9b2f-268b209abefe_default_universal.mp4

Reviewed model image and extracted frames from the 20.85-second upgraded-animation showcase. Visible features: two open triangular kunai, metal bevels, brown crossed grip wraps, chain attachments at both pommels, a reverse grip on the right, cool blue water ribbons, spinning chained inspect. Variants: base, purple/gold, white/silver, black/red. Wiki records continuously looping inspect with up to three speeds and confirms collection kill banners/finishers apply to the guns. The new melee keeps neutral kill feedback instead of borrowing a gun finisher.

The implementation is locally rebuilt procedural geometry and animation with synthesized sound. It is not an extracted Riot asset or a frame-identical reproduction. Reference media is not included in the deployed game. Hands retain the game's voxel styling. The chain uses animated alternating links guided through the inspect hand, and trails retain a bounded motion history.

Validation: finite geometry/transforms for all colorways during equip, accelerated inspect, heavy/light attacks and interruption; browser preview of arsenal selection, colorways, mobile three-speed inspect, heavy-attack interruption, and gun ADS restoration. Browser rendering used the software fallback; physical mobile GPU/gyroscope behavior is not tested in this environment.

## Equip rework, 2026-09-22
Reference: https://valorantinfo.com/videos/levels/f478ae7c-427d-bf16-9b2f-268b209abefe_default_universal.mp4
Inspected frames 0–50 from the 1920×1080, 60 fps upgraded preview and compared the repeated draw at approximately 1.65 s and 18.85 s. The action crosses the arms, spins both blades horizontally over extended fingers, closes the grip, then separates and settles. The previous axial rotation was incorrect.
`kuronami-equip.js` reconstructs screen-space grip landmarks and authors the intervening blade orbit and depth. It is an approximation traced from video, not exported original animation or demonstrated pixel-identical replication. Chain physics, exact joint motion and audio are still reconstructed. 50/60 s duration; open fingers to frame 24, catch at frames 26–30, uncross/settle by frame 44. Frame-by-frame arsenal preview and quarter-speed playback use the same sampler as gameplay. Ribbon samples use absolute animation time so seeking and low frame rates do not change their shape.
Validation: all 18 tests pass, including seek determinism at 30/60/120 Hz and identical final/idle geometry. Browser preview verifies the step/seek controls and reconstructed geometry on the software fallback; the preview environment has WebGL disabled.
