# Reference UI, enemy silhouette and faster reload

## UI

Reference: user-supplied IMG_3071.jpeg lobby and IMG_3073.jpeg armory. The lobby adopts the central agent composition, top navigation, left feature cards, right shortcuts and bottom-right mode/start controls. Agent art changes with the selected playable agent. Armory adopts navy surfaces, coral category headings and large weapon images in four columns (two on portrait phones). Every displayed weapon is playable; selecting it opens existing loadout/skin/inspection controls. No fake currency, social invitations or inactive store features added.

The background is the previously sourced official Ascent skyline (`docs/ascent-art-direction.md`), with existing local agent portrait assets. This is a reference-led UI reconstruction, not a pixel-identical reproduction of the screenshot: selected agents, map backdrop, navigation scope and seven supported weapons differ. Weapon UI PNGs are from the valorant-api response; exact fetched URLs recorded in `dist/assets/ui/sources.json`. These PNGs are UI illustrations, not new weapon model claims. Knife overview image is the base melee category illustration; actual equipped knife is identified by its label and shown in the 3D detail screen.

## Combat

Enemy models receive yellow expanded back-face silhouettes attached to the animated geometry. Only major visual parts are outlined, excluding invisible hitboxes and small face details. Depth testing remains enabled, depth writing disabled; wall occlusion stays in the normal GPU depth pipeline. Outline meshes have no raycast handler and no shadows. Teammates use a cyan overhead diamond. No through-wall overlay is drawn. GPU wall-occlusion behavior uses standard renderer depth semantics; real-device screenshots not measured in this release. Software fallback now handles BackSide materials but remains an approximate painter renderer.

Match reloads run at 1.3× (duration / 1.3, ~23% shorter), including Chaos audio at the same playback rate. `reloadLeft` stays in original clip seconds, preserving animation and part-attachment ordering. Resuming a pause reconstructs the start clock at the same clip position; switching, skill activation and death retain cancellation behavior. Collection preview keeps source timing. Faster sound playback also raises pitch; no time-stretch DSP is claimed.

## Validation

45 unit/regression tests pass, including reload source-frame ordering and pause-clock preservation; outline transforms, hitbox exclusion and raycast exclusion. Mock DOM integration loads the real main module, navigates all seven weapon tiles/detail/back controls and hero selection, then exercises the previous five-agent match/cast flows. All local UI image files decode. Responsive CSS includes desktop, tablet/phone landscape and phone portrait rules; no browser screenshot or physical-device visual acceptance performed this turn. No claim of exact screenshot matching or measured mobile FPS.
