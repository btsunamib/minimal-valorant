---
name: recreate-fps-weapons
description: Reconstruct first-person game guns and knives from gameplay references, including geometry, materials, every action, transformations, VFX, sounds and kill feedback. Use for requests such as 逐帧还原, 复刻切刀/切枪/换弹, 双形态, 武器建模, 连杀音效, or fidelity fixes in a playable FPS. Extract every source frame, implement seekable animation, and require measured frame comparisons before calling an action verified.
---
# 枪械与刀具逐帧还原

Treat “逐帧还原” as an evidence requirement, not a synonym for smooth animation. Aim for the supplied reference at every visible frame. Never promise pixel-perfect fidelity from manually interpolated key poses, guessed geometry, synthetic sounds, or a 60 fps slider alone.

## 1. Resolve the exact asset and complete action matrix

Read the project instructions and existing weapon architecture before editing. Identify the exact localized and original weapon names, generation, upgrade level, color variant, handedness and game build. Search primary sources first; inspect actual video, not descriptions alone. Record provenance, native resolution, frame rate and whether the source has cuts, slow motion or interpolation.

List every applicable action before implementation:
- All idle/hold states; moving, jumping, landing and crouching offsets where distinct.
- Every equip/draw variant, unequip, inspection, loop, exit and cancellation.
- Light attacks, combo order, heavy attacks, recovery and alternating hands.
- Every form, both transition directions, the exact form-commit event, and interrupted transitions.
- Firing, recoil recovery, muzzle flash, tracer, ADS in/out and scoped shot recovery.
- Partial and empty reload, magazine/core removal/insertion, bolt/charge action and interruption.
- Hit/body/head feedback, individual kill cues 1–5+, badge stages, finisher and variant-specific effects.

Use `references/evidence-format.md` for the evidence ledger. Mark actions without usable references `unverified`; do not fill gaps with generic motions and call them restored. Continue authorized useful work, reporting specific unresolved differences without seeking redundant approvals.

## 2. Extract and annotate every source frame

Use `scripts/extract_reference.py VIDEO OUTPUT --start S --duration D`. It preserves source frames and timestamps, writes a manifest and PNGs, and deliberately does not invent 60 fps frames. Extract each action separately with some lead-in/recovery context. Inspect the frames; use a contact sheet for orientation and full-resolution frames for detail. A contact sheet does not replace all-frame annotation.

For every native source frame, record blade/gun silhouette and visible landmarks: tip, bolster, pommel/muzzle, grip, wrists/fingertips, magazine/core and VFX origin. Mark occlusion explicitly. Record catch/contact, trigger, extraction, insertion, ignition, form commit, hit and audio onset frames. Do not label sparse manually chosen keys as original per-frame capture.

## 3. Reconstruct the model before animating

Separate camera, model proportions, hand rig and effects. Match reference aspect ratio and field of view. Match the idle silhouette first, then side/top/rear views available in the reference. Model thickness, bevels, asymmetry, holes, grip wraps, screws, moving parts, materials, symbols and variants. Keep head/body proportions unrelated to view-model scale.

Build real geometry for each form. Reuse only genuinely identical components. Parent carried objects to hands until the contact frame, then attach them to the weapon; avoid double objects or disappearing cores. Label visibility and attachment changes explicitly. When original assets are unavailable, identify the result as reconstructed geometry.

## 4. Implement deterministic motion and feedback

Implement `sample(action, seconds, form, variant)` with absolute time. Support forward/backward seeking to every source frame without depending on previous update calls. Separate cosmetic time from capped physics time; run identical timelines at 30/60/120/165/240 render rates, subject to device capability.

Use per-frame poses or accurately fitted curves, then verify **every** source frame. Sparse interpolation is only a work in progress until that comparison passes. Preserve motion arcs, spin direction/count, pauses, grip changes and recovery. Drive trails/particles analytically or with deterministic seeds so seeking and interruption cannot leave stale effects.

Model transitions with an explicit form-commit event, not on keydown. Preserve the last committed form on gun switching or attack cancellation. Pause/resume both motion and sound together; stop stale audio on switch/death/menu. Prevent asynchronous preload callbacks from reviving a cancelled preview.

Use separate sound slots for each distinct source event. Preserve timing and tails, normalize safely and preload after an allowed user gesture. Never substitute five identical or pitch-shifted samples for five original cues without marking them reconstructed. Layer head impact independently from kill music; throttle duplicate pellet impacts and reset streak indexing at the correct round/life boundary.

## 5. Provide a usable inspection surface

Expose form/variant selection, each action, original speed, quarter speed, previous/next frame, frame count, timeline scrubber, phase label and audio audition. Keep the full weapon and controls visible on phone, tablet and desktop. Keep implementation details out of normal gameplay. Use existing touch buttons and multi-pointer handling; movement must not block switching/inspection/reload.

## 6. Validate fidelity and gameplay separately

Read `references/acceptance.md`. Generate reference/render pairs at every native source timestamp with the same camera. Compare silhouettes, landmarks, hand contact, VFX and audio onset. Run `scripts/audit_landmarks.py manifest.json reference.json rendered.json report.json --max-error 2` for the geometric landmark gate (default 2 reference pixels at 1080p). It is a gate for landmarks only, never proof of identical materials, sound or pixels. Use explicit masks for image differences; exclude only background/UI, never hide a mismatching weapon or hand.

Exercise interruption before, at and after every attachment/form-commit event, repeated input, death, round reset, low FPS, touch movement plus another action, audio disabled and storage reload. Do not equate finite-matrix/unit tests with visual accuracy. Save screenshots or side-by-side clips of the final implementation. Report real-device performance only if measured there; software-renderer preview is not GPU quality evidence.

## 7. Deliver and version honestly

Record source, per-action status, errors, unresolved differences and validated commit. Call the result “逐帧对照完成” only for actions with complete evidence and passing gates; reserve “完全一致” for genuinely established equivalence. A user-authorized interim release may include unresolved reconstruction, but label it plainly.

Follow the project's publishing instructions and existing hosting skill. Include all source, locally used assets, tests and provenance in requested archives; exclude secrets, dependencies and internal credentials. If GitHub synchronization is configured, commit and sync the exact release before deployment, record both commit identities when they differ, and verify the remote branch. Never report GitHub sync as complete without an accessible repository and a successful verified write. Preserve unrelated edits and remote history; never force push.
