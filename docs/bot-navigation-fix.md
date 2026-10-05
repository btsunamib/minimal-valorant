# Bot navigation release — 2026-10-05

Browser cache version: `20261005-botnav1`.

The controller used to replace every bot's route every 0.7–1.4 seconds. Native routes begin at the current navigation area's center, so a bot crossing a large area repeatedly turned back toward that center. A deterministic reproduction with one-second replans and the actual spawn formation showed Breeze and Lotus bots traveling approximately 145–151 meters in 45 seconds while ending only 3–6 meters from spawn.

The controller now retains an unfinished route. It replans when its destination changes by more than 1.25 meters (or changes floor), when physical movement stalls for 0.8 seconds, or when a completed bot is displaced. Replanning has a cooldown, and failed searches retry once per second. On replanning, it skips an old starting center only when the next segment passes the native physical traversal check.

Respawn resets all navigation state. The follower consumes repeated/reached waypoints before calculating directions and reports moving only when the actor actually moves. Unreachable offset defense positions fall back to their reachable site. Combat retreat also guards against coincident actor positions.

Validation:

- Five controller regressions cover persistent routes, moving destinations, stuck recovery, duplicate points, failed searches, displacement and respawn.
- 130 routes cover all five real formation slots on both sides of all six native maps, to every site, using 30/60/144 FPS steps and BSP floor/collision queries. Each stable destination completes with one plan. All four original Breeze/Lotus spawn-circling scenarios leave spawn by 45 seconds or reach their site earlier.
- 108 scenarios execute the production `updateBots` and `moveEntity` functions, covering all nine bots, both attack-team assignments and all six maps, with dynamic map collision and door interaction. All routes complete; new-round navigation state resets are checked. DOM/canvas and model animation updates are mocked to isolate controller behavior.
- The complete unit and integration suites also cover map movement, mobile input, match economy, weapons, collections, tactical abilities and rendering settings.

This verifies physical movement and controller behavior; it does not assess tactical decision quality or visual fidelity.
