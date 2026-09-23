# Naru-Kami / 泷吟 · 塑水宗 2.0

Implemented September 23, 2026. Non-official reconstruction in the existing block-world game.

## Reference and assets

- Skin metadata: https://valorant-api.com/v1/weapons/skins/d0873346-4e42-238e-0251-a399eff11f2f
- Riot 1920×1080, 60 fps Level 2 preview: https://valorant.dyn.riotcdn.net/x/videos/release-13.05/ddf2b28b-45ef-7748-03f0-0caf03d5c8dd_default_universal.mp4
- Reference stills: the four fullRender URLs in the metadata. Base, purple, white and black color schemes.
- The six audio excerpts in `dist/assets/narukami` come from that preview, with 6 ms fade-in / 55 ms fade-out. Source content belongs to Riot Games. No original mesh or animation rig is included.

| Clip | Reference start | Duration | 60 Hz frames |
|---|---:|---:|---:|
| Long equip | 0.90 s | 1.20 s | 72 |
| Kunai equip | 13.20 s | 0.70 s | 42 |
| Long → kunai | 8.35 s | 3.20 s | 192 |
| Kunai → long | 22.55 s | 3.00 s | 180 |
| Light slash sound | 4.94 s | 0.40 s | — |
| Heavy slash sound | 6.94 s | 0.70 s | — |

The model uses layered bevelled steel profiles, a wrapped grip, diamond pommel, water glyph, a separate translucent water blade, animated flow lines, droplets and deterministic trailing ribbons. Two articulated hands follow the knife. The long stance is held across the lower screen; the short stance points up-left from the right hand.

`narukami-motion.js` contains hand-traced key poses and interpolation, not 486 original captured rig frames. The controls permit seeking at 60 Hz and quarter-speed playback of each of the four clips. This is an approximation of the observed motion; hand anatomy, exact water simulation, shading and minor timing differ from the original. The original reference is not rendered as a video overlay.

## Behavior

F and the existing mobile inspect control transform the knife. The control reads 转苦无 / 转长刀 / 转换中. Gun/knife toggling keeps the selected form. Water commits at frame 65 when dissolving, and frame 68 when forming; an attack or weapon switch cancels the remaining animation without changing to an unseen form. Repeated inspect input during an active clip is ignored. Both forms have light and heavy attacks. Form remains cosmetic: range, damage and weapon switching rules are shared.

The chosen starting form and variant are saved with the existing loadout. Live transformation state persists across gun/knife switching. Preview playback uses wall time; scrubbing cancels outstanding asynchronous audio startup and audio is silent in slow motion. Gameplay clips pause with overlays; audio resumes from the stored clip offset.

## Combat audio update

- Added an independent synthesized head impact, including nonlethal head hits. It can layer over a kill cue and is throttled over 35 ms to avoid stacked shotgun-pellet noise.
- Chaos now has distinct 1–5 pitch steps (0, 2, 4, 7, 12 semitones) from the previously available real kill sample, with a synthesized fifth-kill tail. These are **reconstructed cues, not the five original isolated master files**.
- The VALORANT Wiki listed the individual files, but direct download failed and its browser media link was blocked by URL policy. No attempt was made to circumvent the browser block.
- Team mode uses the current life streak; death resets its kill-audio ladder and badge count. Bomb/ranked modes use round kills. Other skins and knives use the generic five-level cue.

## Validation

38 automated tests pass, including every seekable Naru frame, all color variants, both idle and attack forms, water transition interruption, independent headshot layering, distinct Chaos kill steps, reload cancellation, touch multi-pointer actions, barriers, gyro and layout tests. Browser preview verified both conversion timelines and frame seeking. A live bot match using touch controls verified 转长刀 → 转苦无 and retained the long form after gun/knife toggling. Cloud browser uses the software renderer; it cannot establish real-device GPU quality or phone frame rate.
