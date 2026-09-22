# Prelude to Chaos Vandal — implementation reference

Sources inspected 2026-09-22:
- https://valorantinfo.com/weapons/vandal/prelude-to-chaos
- Level 3 animation: https://valorantinfo.com/videos/levels/VALskinpreview_Demonstone_Vandal_03.mp4
- Level 4 feedback: https://valorantinfo.com/videos/levels/VALskinpreview_Demonstone_Vandal_04.mp4
- Skin metadata and 4 profile renders: https://valorant-api.com/v1/weapons/skins?language=en-US (skin 522a264e-4ca7-adb0-6cf1-28b2ef938727).

The footage is a mirror of Riot's skin preview, 1920×1080 at approximately 60 fps.
The 3D model is independently reconstructed geometry, not Riot's original model/skeleton.
Equip reconstruction uses reference key poses over a 72-frame/1.2-second timeline,
with frame-independent interpolation and arbitrary seeking. The depth, fingers and
secondary motion are approximations; this is not a verified exact frame-for-frame match.

Local audio excerpts (MP3):
- equip.mp3: Level 3, 1.62–2.84 seconds.
- shot.mp3: Level 3, 7.79–8.18 seconds.
- kill.mp3: Level 4, 0.40–2.30 seconds. Contains preview finisher ambience.
The five independent soundboard samples were discoverable but could not be downloaded.
All kills currently use this same acquired kill sound, without fabricated pitch shifts;
the arsenal explicitly marks successive-kill notes as pending refinement.

The kill crest is a native SVG reconstruction from Level 4, including mechanical
mask, red triangular core, dual circles, crown and burst accents. Motion is
reconstructed, not extracted original alpha footage. No claim of exact fidelity.

Only Vandal uses the Chaos model/sound/feedback. Other guns fall back to Jade when
Chaos is selected; knife-specific models and touch pointer capture remain intact.
Other previously requested work remains deferred under work-in-progress/agents.
