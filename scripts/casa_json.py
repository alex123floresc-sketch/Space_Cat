"""Convierte la casa de ejemplo de la aplicación (casa-ejemplo.amob3d) en src/data/casa.json,
el formato compacto que dibuja la vista 3D de la web.

Uso:  python scripts/casa_json.py ../src/main/resources/ejemplo/casa-ejemplo.amob3d
"""
import json, sys
from pathlib import Path

SLAB = 0.2          # losa entre pisos, igual que FSHFHome.SLAB
PASO = ('door', 'passage', 'entry')

src = Path(sys.argv[1] if len(sys.argv) > 1 else '../src/main/resources/ejemplo/casa-ejemplo.amob3d')
d = json.loads(src.read_text(encoding='utf-8'))
espacios = [dict(d['space'], project=d)] + d['spaces']

alto = {}
for s in espacios:
    alto[s['level']] = max(alto.get(s['level'], 0), s['project']['room']['height'])
elev = {}
y = 0.0
for lv in sorted(alto):
    elev[lv] = round(y, 3)
    y += alto[lv] + SLAB

r2 = lambda v: round(v, 3)
rooms = []
for s in espacios:
    p, r = s['project'], s['project']['room']
    rooms.append({
        'n': s['name'], 'lv': s['level'], 'x': s['x'], 'z': s['z'],
        'w': r['width'], 'l': r['length'], 'h': r['height'], 't': r['wallThickness'],
        'piso': p['surfaces']['piso']['color'], 'pared': p['surfaces']['pared-norte']['color'],
        'cuts': {k: [] for k in ('norte', 'sur', 'este', 'oeste')},
        'muebles': [[f['type'], r2(f['x']), r2(f['z']), round(f['rotation']), f['width'], f['depth'], f['height'], f['color']]
                    for f in p['furniture']],
        '_o': p['openings'],
    })

OPUESTA = {'norte': 'sur', 'sur': 'norte', 'este': 'oeste', 'oeste': 'este'}


def plano(R, lado):
    """Coordenada mundial de la cara interior del muro y si corre a lo largo de X."""
    return {'norte': (R['z'], True), 'sur': (R['z'] + R['l'], True),
            'oeste': (R['x'], False), 'este': (R['x'] + R['w'], False)}[lado]


for R in rooms:
    for o in R['_o']:
        tipo = o['type']
        R['cuts'][o['wall']].append([r2(o['offset']), o['width'], o['sill'], o['height'], tipo])
        if tipo not in PASO:
            continue
        # el mismo vano en el muro del ambiente vecino (los muros de ambientes contiguos van pegados)
        c, ax = plano(R, o['wall'])
        a0 = (R['x'] if ax else R['z']) + o['offset']
        for B in rooms:
            if B is R or B['lv'] != R['lv']:
                continue
            lb = OPUESTA[o['wall']]
            cb, _ = plano(B, lb)
            if abs(abs(c - cb) - (R['t'] + B['t'])) > 0.02:
                continue
            b0 = a0 - (B['x'] if ax else B['z'])
            largo = B['w'] if ax else B['l']
            if b0 >= -1e-6 and b0 + o['width'] <= largo + 1e-6:
                B['cuts'][lb].append([r2(b0), o['width'], o['sill'], o['height'], 'link'])

for R in rooms:
    del R['_o']

out = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'casa.json'
out.write_text(json.dumps({'elev': elev, 'slab': SLAB, 'rooms': rooms}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
area = sum(R['w'] * R['l'] for R in rooms)
print(out, len(rooms), 'ambientes', round(area, 2), 'm2', sum(len(R['muebles']) for R in rooms), 'muebles',
      sum(1 for R in rooms for c in R['cuts'].values() for x in c if x[4] == 'link'), 'vanos vecinos')
