# Evidence ledger

Store one ledger per weapon in the project, outside this installed skill. Include:

```json
{
  "weapon": "localized / original exact name",
  "variant": "base",
  "reference": {"url": "https://...", "sha256": "...", "native_fps": "60/1", "width": 1920, "height": 1080},
  "actions": [{
    "id": "equip-long", "start": 0.9, "duration": 1.2,
    "status": "unverified", "manifest": "reference/manifest.json",
    "source_annotations": "reference/points.json", "render_annotations": "captures/points.json",
    "events": [{"frame": 38, "name": "water-forms"}],
    "model_checks": ["silhouette", "bevel", "grip", "hand-contact"],
    "audio": {"origin": "source-excerpt | original-file | reconstructed | missing", "onset_error_ms": null},
    "differences": ["Describe concrete remaining differences"],
    "report": null, "verified_commit": null
  }]
}
```

Use statuses `unverified`, `reconstructed`, `measured-pass`, `not-applicable`. Explain every not-applicable entry. Do not copy a passing report from a different animation or commit.

## Per-frame landmark annotation

Use coordinates in the reference resolution. If renders have a different resolution, convert by the known uniform viewport scale; do not use a free affine warp to disguise mismatched geometry.

```json
{
  "required_landmarks": ["tip", "bolster", "right-wrist", "left-wrist"],
  "frames": [
    {"index": 0, "points": {"tip": [1200,700], "bolster": [1000,820], "right-wrist": [1100,900], "left-wrist": null}}
  ]
}
```

Include one record per manifest frame. Use `null` only for a genuinely occluded/out-of-frame landmark. Include a written explanation for long occlusions. Have a human or visual inspection confirm markings; fabricated coordinates make a metric meaningless. Keep silhouettes, effects and sounds as separate evidence from this landmark file.
