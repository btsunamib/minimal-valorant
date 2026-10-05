"""Bake bounded contact occlusion, sky exposure and sun visibility into RGB8.

Uses the supplied static BSP, without altering geometry, collision or navigation.
The browser interpolates these vertex samples; this is not a Lightmass lightmap.
"""
from pathlib import Path
import gzip, hashlib, json, struct, sys, time
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
PROFILE = ROOT / 'dist/map-lighting-profiles.js'
PROFILES = json.loads(PROFILE.read_text().split('=', 1)[1].strip().removesuffix(';'))


class BspRays:
    def __init__(self, data):
        self.planes = np.asarray(data['planes'], dtype=np.float64)
        self.nodes = np.asarray(data['nodes'], dtype=np.int32)
        self.leaves = np.asarray(data['leaves'], dtype=np.int32)
        self.roots = data['roots']

    def distances(self, origin, direction, length):
        """First solid along every segment, splitting at exact BSP planes."""
        count = len(origin)
        axes = np.array([0, 2, 1])
        start = origin[:, axes] * np.array([32, -32, 32])
        delta = direction[:, axes] * np.array([32, -32, 32]) * length
        first = np.ones(count)
        for root in self.roots:
            ids = np.arange(count)
            if isinstance(root, dict):
                bounds = np.asarray(root['bounds']).reshape(2, 3)
                inv = np.divide(1., delta, out=np.full_like(delta, 1e20), where=np.abs(delta) > 1e-12)
                a, b = (bounds[0] - start) * inv, (bounds[1] - start) * inv
                lo = np.maximum(0, np.min([a, b], axis=0).max(axis=1))
                hi = np.minimum(1, np.max([a, b], axis=0).min(axis=1))
                ids = ids[lo <= hi]
                stack = [(root['node'], ids, lo[ids], hi[ids])]
            else:
                stack = [(root, ids, np.zeros(count), np.ones(count))]
            while stack:
                node, ids, lo, hi = stack.pop()
                keep = lo < first[ids]
                ids, lo, hi = ids[keep], lo[keep], hi[keep]
                if not len(ids):
                    continue
                if node < 0:
                    if self.leaves[-node - 1] == -2:
                        first[ids] = np.minimum(first[ids], lo)
                    continue
                plane, front, back = self.nodes[node]
                normal, offset = self.planes[plane, :3], self.planes[plane, 3]
                base = (start[ids] * normal).sum(axis=1) - offset
                slope = (delta[ids] * normal).sum(axis=1)
                a, b = base + slope * lo, base + slope * hi
                is_front, is_back = (a >= 0) & (b >= 0), (a < 0) & (b < 0)
                crossing = ~(is_front | is_back)
                if is_front.any():
                    stack.append((front, ids[is_front], lo[is_front], hi[is_front]))
                if is_back.any():
                    stack.append((back, ids[is_back], lo[is_back], hi[is_back]))
                if crossing.any():
                    ix, l, h, aa, ss = ids[crossing], lo[crossing], hi[crossing], a[crossing], slope[crossing]
                    mid = np.clip(-base[crossing] / ss, l, h)
                    starts_front = aa >= 0
                    # Both subsegments are needed; first[] prunes farther hits.
                    for mask, first_node, second_node in [(starts_front, front, back), (~starts_front, back, front)]:
                        if mask.any():
                            stack.append((second_node, ix[mask], mid[mask], h[mask]))
                            stack.append((first_node, ix[mask], l[mask], mid[mask]))
        return first * length


def unit(v):
    return v / np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-12)


def bake(key):
    start_time = time.monotonic()
    directory = ROOT / 'dist/assets/maps' / key
    packed = (directory / 'map.json.gz').read_bytes()
    data = json.loads(gzip.decompress(packed))
    position = np.concatenate([np.asarray(m['positions']).reshape(-1, 3) for m in data['meshes']])
    normal = unit(np.concatenate([np.asarray(m['normals']).reshape(-1, 3) for m in data['meshes']]))
    # Shared corners with identical normals use one deterministic sample.
    unique, inverse = np.unique(np.round(np.column_stack([position, normal]), 4), axis=0, return_inverse=True)
    pos, n = unique[:, :3], unit(unique[:, 3:])
    origin = pos + n * .075
    rays = BspRays(data)
    tangent = unit(np.cross(n, np.where((np.abs(n[:, 1]) < .9)[:, None], [0, 1, 0], [1, 0, 0])))
    bitangent = unit(np.cross(n, tangent))
    occlusion = np.zeros(len(pos))
    for angle in np.arange(6) * np.pi / 3:
        direction = unit(n * .6 + tangent * (np.cos(angle) * .8) + bitangent * (np.sin(angle) * .8))
        distance = rays.distances(origin, direction, 1.8)
        occlusion += np.where(distance < 1.799, np.exp(-distance / .7), 0) / 6
    # Contact darkening is capped at 22%; existing baked lights remain primary.
    ao = 1 - .22 * np.clip(occlusion, 0, 1)
    sky = np.zeros(len(pos))
    for direction in [[0, 1, 0], [.45, 1, 0], [-.45, 1, 0], [0, 1, .45], [0, 1, -.45]]:
        d = np.broadcast_to(unit(np.array(direction, dtype=float)), pos.shape)
        sky += (rays.distances(origin, d, 14) > 13.999) / 5
    sun_direction = unit(np.asarray(PROFILES[key]['direction'], dtype=float))
    sun = (rays.distances(origin, np.broadcast_to(sun_direction, pos.shape), 14) > 13.999).astype(float)
    values = np.round(np.column_stack([ao, sky, sun]) * 255).astype(np.uint8)[inverse]
    payload = b'MVL1' + struct.pack('<I', len(position)) + values.tobytes()
    output = gzip.compress(payload, mtime=0)
    (directory / 'lighting.bin.gz').write_bytes(output)
    print(key, len(position), 'vertices,', len(pos), 'samples,', len(output), 'bytes,', round(time.monotonic() - start_time, 2), 'seconds', flush=True)
    return {'map': key, 'sourceMapSHA256': hashlib.sha256(packed).hexdigest(), 'vertices': len(position), 'samples': len(pos), 'bytes': len(output), 'sha256': hashlib.sha256(output).hexdigest(), 'aoRange': [float(values[:, 0].min() / 255), float(values[:, 0].max() / 255)], 'skyOpenFraction': float((values[:, 1] > 127).mean()), 'sunOpenFraction': float(values[:, 2].mean() / 255)}


if __name__ == '__main__':
    if '--self-test' in sys.argv:
        # A 2 cm occluder must not be missed as it would be by stepped rays.
        rays = BspRays({'planes': [[1,0,0,32.64],[1,0,0,32]], 'nodes': [[0,-1,1],[1,-2,-1]], 'leaves': [-1,-2], 'roots': [0]})
        origins = np.array([[2.,0,0],[0.,0,0],[1.01,0,0]])
        directions = np.array([[-1.,0,0],[-1.,0,0],[1.,0,0]])
        np.testing.assert_allclose(rays.distances(origins,directions,4),[.98,4,0],atol=1e-8)
        print('PASS exact BSP ray splits, thin-wall occlusion, clear rays and solid starts')
        raise SystemExit(0)
    keys = sys.argv[1:] or ['ascent', 'breeze', 'sunset', 'pearl', 'lotus', 'fracture']
    records = [bake(key) for key in keys]
    if len(keys) == 6:
        report = {'format': 'MVL1 RGB8: bounded contact factor, sky visibility, static sun visibility', 'profileSHA256': hashlib.sha256(PROFILE.read_bytes()).hexdigest(), 'maps': records}
        (ROOT / 'docs/map-lighting-bake.json').write_text(json.dumps(report, indent=2) + '\n')
