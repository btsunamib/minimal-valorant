# Five playable agents — reconstruction release

Roster: Jett (捷风), Sage (贤者), Sova (猎枭), Phoenix (不死鸟/凤凰), Raze (雷兹).

## Integrated

- Lobby agent picker, locally stored selection, local portraits and four ability descriptions.
- Player kit, distinct bot models and names, normal 1.86 m / .24 m head proportions (7.75 heads); team has one of each role model.
- C/Q/E/X keyboard and independent touch buttons; ultimate button joins custom layout presets.
- 20 local skill behaviors: smoke, updraft, dash, knives; destructible wall, slow, heal, revive; autonomous drone, shock arrow, recon, beam; fire wall, fire pool, flash, return anchor; boom bot, satchel boost, cluster grenade, rocket.
- Reconstructed first-person sleeve/palm/finger rig: throw, orb channel, bow draw, movement gesture and ultimate props. Effect commits at action release; pre-release switching cancels without spending charges; pause freezes the clock, death/round/menu clears it.
- Gun draw timeline runs at 1.3× during matches (about 23% shorter duration); Chaos equip audio follows the same rate. Knife timelines and collection reference speed unchanged.

## Evidence and limits

Official character reference pages: https://playvalorant.com/en-us/agents/jett/ , /sage/ , /sova/ , /phoenix/ , /raze/ . Portrait and ability images carried forward from the 2026-09-22 valorant-api zh-CN snapshot in work-in-progress/agents; see original snapshot provenance. They are not new original illustrations.

This is a functional local reconstruction, NOT original Riot skeletal meshes or frame-verified animations. Shared anatomical mesh generator retains simplified clothing/accessories. Skills have simplified geometry, targeting and balance: drone is autonomous, satchel is immediate boost, bow has no bounce/charge controls, flash has simplified visibility logic, utility uses local charges rather than a full skill shop. Ultimate points are earned through kills. Skill cast/weapon draw timings are customized, not exact source timings. First-person effects and sounds are procedural. Do not label this release 1:1 or every-frame verified.

Validation: runtime tests cover all 20 skills, buy locks, cleanup, wall collision/destruction, heal/revive, Phoenix lethal return, knife ammo refill, finite humanoid/hand transforms and release boundaries; existing mobile controls, gyro, weapon and gameplay tests retained. No physical phone/GPU performance measurement or full visual fidelity acceptance in this release.

Integration QA also loaded the real main module in a mocked DOM/Canvas: all five selections start a match, all 20 casts traverse input/commit/recovery, pre-release switch cancels, HUD and return-to-lobby reset run without exceptions. This is not browser rendering or real-device visual proof. Total unit/regression tests: 43 passing.
