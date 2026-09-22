# Kuronami no Yaiba reconstruction

Reference review: 22 September 2026.

- https://valorantinfo.com/weapons/melee/kuronami-no-yaiba
- https://wiki.playvalorant.com/en-us/Kuronami_Collection
- https://media.esports.gg/uploads/2024/01/Kuronami-Melee-1568x882.jpg
- Upgraded animation video linked on ValorantInfo: /videos/levels/f478ae7c-427d-bf16-9b2f-268b209abefe_default_universal.mp4

Reviewed model image and extracted frames from the 20.85-second upgraded-animation showcase. Visible features: two open triangular kunai, metal bevels, brown crossed grip wraps, chain attachments at both pommels, a reverse grip on the right, cool blue water ribbons, spinning chained inspect. Variants: base, purple/gold, white/silver, black/red. Wiki records continuously looping inspect with up to three speeds and confirms collection kill banners/finishers apply to the guns. The new melee keeps neutral kill feedback instead of borrowing a gun finisher.

The implementation is locally rebuilt procedural geometry and animation with synthesized sound. It is not an extracted Riot asset or a frame-identical reproduction. Reference media is not included in the deployed game. Hands retain the game's voxel styling. The chain uses animated alternating links guided through the inspect hand, and trails retain a bounded motion history.

Validation: finite geometry/transforms for all colorways during equip, accelerated inspect, heavy/light attacks and interruption; browser preview of arsenal selection, colorways, mobile three-speed inspect, heavy-attack interruption, and gun ADS restoration. Browser rendering used the software fallback; physical mobile GPU/gyroscope behavior is not tested in this environment.
