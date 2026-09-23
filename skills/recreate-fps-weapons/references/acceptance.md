# Acceptance checks

| Surface | Required evidence |
|---|---|
| Model | Matched camera, idle plus available side/top/rear silhouettes, bevel/thickness/material checks |
| Every action | All source timestamps rendered, complete landmarks, reference/render pairs, errors reported |
| Contact | Fingers/grip and object attachments before/on/after catch, insertion and form commit |
| VFX | Correct start/end frames, origin and shape, color variant, deterministic seek, no residual trail |
| Audio | Separate slots, source origin, onset delta, tail, volume, layered headshot, interrupted playback |
| Gameplay | Correct cosmetic-only damage/range, repeated input, interruptions, pause/death/round reset |
| Devices | Touch movement plus second/third pointer actions, responsive controls, honest measured FPS |
| Release | Source commit, tests, evidence, synchronized GitHub commit if configured, confirmed deployment |

Default landmark tolerance: 2 pixels at a reference height of 1080 pixels (scale with reference height). Default key-event timing tolerance: no more than one native source frame. These are practical measurement gates, not proof of literal equality. Do not relax thresholds to turn a failure green without explicit project justification. Record the observed error and continue improving the model/curve.

For silhouette checking, use per-frame binary weapon-and-hand masks. Show outlines overlaid at equal opacity and inspect mismatches. A background mismatch must not drive geometry changes. SSIM over an entire Minecraft-versus-Valorant frame is not a useful weapon fidelity score.

Forward-test the workflow on a short local reference segment: extract frames, annotate a small known set, verify that missing frames/points fail, alter one point beyond tolerance and confirm failure, then use identical validated annotations to confirm the script's zero-error baseline. This tests the auditor, not the reconstruction.
