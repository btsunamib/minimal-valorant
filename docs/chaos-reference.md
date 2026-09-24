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

## Dedicated reload update

Reference: the same Level 3 clip, 10.05–12.65 s; 156-frame timeline at 60 fps.
Phases inspected in the video: chamber presentation, purple core fragmentation,
right-hand replacement stone insertion and palm press, left-hand collar rotation,
blue re-ignition and return to firing stance. The magazine remains seated.
`chaos-reload.js` records timed reconstructed 3D poses and phase boundaries.
`reload.mp3` is the corresponding source audio excerpt with 10/80 ms edge fades.
The motion and articulated hands are reconstruction, not an imported source rig;
frame inspection is supported but exact per-pixel equivalence is not established.
The dedicated animation uses 2.6 s including source lead-in and settle, while other
weapons retain their previous timings. Ammo transfers only at reload completion.
Switching, inspection, death, round end and menu exit stop reload sound. Pausing
freezes reload progress; resuming restarts sound from that offset. Original-speed
preview and in-game Chaos reload use elapsed time, avoiding audio drift at low FPS.
All four variants have frame-seeking/cancellation coverage, including core handoff.

### Follow-up: kill ladder and head impacts

The previous note that all five kill buttons reused an identical cue is superseded. The available real kill sample now uses five distinct pitch steps (0, 2, 4, 7, 12 semitones) and a synthesized fifth-kill ending. A separate synthesized head impact layers over the cue, including nonlethal hits. This is a reconstruction, not the original isolated set. Team mode indexes by the life streak, and resets after death. See `narukami-reference.md` for the download limitation and validation.

## 2026-09-24: independent kill audio and layered crest

Supersedes the pitch-ladder implementation above. Five **separate downloaded MP3s**
from the VALORANT Wiki public Cosmetic SFX archive are now shipped locally as
`kill1.mp3` through `kill5.mp3`. They retain the source bytes and playback rate 1;
there is no transposition, synthetic fifth-kill ending or duplicate single-sample
fallback. Each file has a recorded public source ID, SHA-256 and duration in
`dist/assets/chaos/kill-sources.json`. Kills 1–4 are 3.143786 seconds each and kill 5
is 7.192786 seconds. This is the Wiki-distributed game audio, not an independently
authenticated Riot studio master. The older finisher-contaminated `kill.mp3` is no
longer loaded. Head impact stays a separate synthesized layer. Missing audio
retries on a subsequent gesture; it does not silently substitute an altered cue.

Crest reference: EP5 Vandal Level 4 preview, 1920×1080, 60/1 fps, source segment
0.40–2.80 s, 144 extracted native frames. `docs/references/chaos-badge-manifest.json`
records source hash and every timestamp; `chaos-badge-contact.jpg` is an orientation
sheet, not a complete fidelity audit. Updated SVG motion separates mask drop,
outer/inner circle expansion, crown, gem flash, orbiting red arcs and shrink exit.
It samples absolute time and supports backwards/forwards frame seeking at 60 Hz
and quarter-speed playback in the existing arsenal. No rotating whole halo or
single bounce animation remains. Repeated previews cancel pending async starts.
Switching weapon, leaving the arsenal, pausing, death and menu exit stop stale cues.

**Status: reconstructed, not measured-pass.** The crest is still traced SVG,
not original transparent animation. Exact contour, crown details, arc shape,
color grading and frame timings have not passed per-frame landmark/pixel gates.
144 seekable frames and successful tests do not prove 144 matched source frames.
Original source frames can be regenerated with the weapon workflow extractor;
they remain in the working reference folder and are not shipped to players.
