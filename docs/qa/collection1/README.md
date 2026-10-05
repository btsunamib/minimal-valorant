# Collection QA — 20261006-collection1

Real Chrome WebGL with SwiftShader, locally served final resources; source GitHub downloads were routed to their matching local files. 40 unique model/viewport cases, four overview layouts and both new native feedback families. Evidence was collected in scoped runs: the final four Kunai cases replace the initial cases; the final overview/feedback run completed successfully. `results.json` combines those measured results; separate files retain the component measurements.

Model cases check every visible projected vertex, 60 repeated static updates, native inspect/hands restoration and action → model recovery. Dual blade/chain panels retain a minimum measured screen gap of approximately 12.75 px. Overview cases check all 20 cards for overlap and reserved label space, then scroll to the bottom to check access to the lower categories.

The unit suite passed 163/163. Final relevant model, resource/hash/audio and cache tests passed again. Actual collection → equip → lobby → gameplay, reload, alternate knife attacks and download failure/retry integration passed.

Screenshots use headless QA fonts (Chinese glyphs appear as boxes); this is not a production text regression. This is not physical-device performance measurement or reference-video fidelity verification. Native actions remain `unverified` for that separate source-video comparison gate.
