# Mercy knife + mobile controls + buy barriers

Published slice requested by user before the larger agent update.

## Behavior
- Touch tap actions use pointerdown for every pointer, not browser synthesized click. A joystick held by finger one no longer prevents finger two/three toggling weapons, ADS, reload, inspect, crouch, or abilities. Synthetic clicks are deduplicated. Keyboard/mouse clicks remain supported. Desktop HUD clicks no longer accidentally request pointer lock/fire before the button action.
- Both teams have team-aware full-width buy-zone collision in bomb/ranked, including radius and large movement steps. Attacker boundary z=14, defender z=-10; applies after side swaps. Translucent walls and minimap lines clear at live/end/menu. Team deathmatch has no barrier. Buy period remains 10 seconds.
- Mercy knife: independent layered drop-point geometry, bevels, Damascus etching, grip inlay, medallion, ring pommel, articulated hands, ribbon trails, red/Pacific purple/Americas green/EMEA blue; leading-kill aura. Equip sampled at 60 fps from 49 manually traced source poses, deterministic arbitrary seek and quarter-speed preview. Inspect and attack are reconstructed approximations.

## Animation reference
Riot in-client Level 2 preview (4K, 60 fps, 19.9667 s), obtained from the current skin metadata:
https://valorant.dyn.riotcdn.net/x/videos/release-13.05/cf7566a9-4df7-ca7b-116b-0b801ce0698a_default_universal.mp4

Level 3 aura:
https://valorant.dyn.riotcdn.net/x/videos/release-13.05/2cbac4da-4026-3113-41a7-f1b006eb4066_default_universal.mp4

Metadata:
https://valorant-api.com/v1/weapons/skins?language=en-US

The 3D model, hand rotations/depth, VFX width/opacity and synthesized audio are reconstructed. This is not extracted original animation/skeleton data or verified pixel-identical reproduction. Trace records screen-space bolster and blade-tip positions for each frame of the first equip. The full source videos are not shipped.

## Validation
Node tests cover non-primary-pointer activation, click deduplication, disabled action state, both teams/side swaps/live transitions and every equip frame/all variants/interruption/deterministic seeking. Existing weapons, gyro, frame pacing and mobile layouts remain under regression tests. Cloud browser preview checks UI and runtime; physical iOS/Android multi-touch hardware cannot be exercised by that browser.
