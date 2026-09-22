# Mobile controls update

- Full-screen HUD editor: pointer dragging, per-control size and opacity, 2 px nudges, foldable top panel, save/apply, discard and reset.
- Independent two-, three- and four-finger presets for landscape and portrait, persisted with local preferences. Positions use normalized coordinates and clamp to the viewport after size/orientation changes. Includes joystick, all touch buttons, abilities, minimap, health and ammo.
- Joystick interaction region follows the configured joystick; camera drag remains available elsewhere. Editor pauses the match and clears held input. Background rendering stops while editing.
- Knife button toggles to the last selected gun, including pistol; direct gun selection remains available.
- Gyro: retains orientation compensation and calibration. Removes per-event small-motion dead zone; uses an exact critically damped response with faster response during deliberate motion and continuous output at high refresh rates. No unbounded prediction or continued rotation after sensor stops.
- Real frame caps: automatic, 60, 90, 120, 165, 240. requestAnimationFrame scheduling respects the cap; measured FPS display reports rendered callbacks, not the requested cap. It cannot override display/browser refresh limits.

Validation: 22 Node tests, including all refresh/cap combinations, micro-motion angle conservation at 60/120/165/240 Hz, preset bounds for phone/tablet orientations, and all previous axis regressions. Browser QA: drag/resize/opacity changes, saving/reloading, discarding reset, rifle–knife and pistol–knife round trips. Preview browser has WebGL disabled; real-device sensor feel and sustained high refresh performance are not measured here.
