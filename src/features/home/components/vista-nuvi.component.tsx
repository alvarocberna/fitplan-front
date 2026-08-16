// ojos: fila por fila a partir de una elipse, para un óvalo pixelado fino
const EYE_ROW_HEIGHT = 1.35;
const EYE_CENTER_Y = 22;
const EYE_RADIUS_X = 10.5;
const EYE_RADIUS_Y = 13.5;
const EYE_ROW_COUNT = Math.round((EYE_RADIUS_Y * 2) / EYE_ROW_HEIGHT);
const EYE_PIXEL_ROWS = Array.from({ length: EYE_ROW_COUNT }, (_, i) => {
  const y = EYE_CENTER_Y - EYE_RADIUS_Y + i * EYE_ROW_HEIGHT;
  const dy = y + EYE_ROW_HEIGHT / 2 - EYE_CENTER_Y;
  const ratio = Math.max(0, 1 - (dy / EYE_RADIUS_Y) ** 2);
  return { w: 2 * EYE_RADIUS_X * Math.sqrt(ratio), y };
});

// boca: curva continua (seno) en vez de puntos interpolados linealmente,
// para evitar quiebres rectos entre tramos y lograr un arco de sonrisa fluido
const MOUTH_PIXEL_WIDTH = 3;
const MOUTH_PIXEL_HEIGHT = 8;
const MOUTH_START_X = 28;
const MOUTH_SPAN = 64; // ancho de la boca (comisura a comisura)
const MOUTH_TOP_Y = 60; // altura de las comisuras
const MOUTH_DEPTH = 12; // cuánto baja el centro respecto a las comisuras
const mouthCurveY = (x: number) => {
  const t = Math.min(1, Math.max(0, (x - MOUTH_START_X) / MOUTH_SPAN));
  return MOUTH_TOP_Y + MOUTH_DEPTH * Math.sin(Math.PI * t);
};
const MOUTH_END_X = MOUTH_START_X + MOUTH_SPAN + MOUTH_PIXEL_WIDTH;
const MOUTH_COL_COUNT = Math.round((MOUTH_END_X - MOUTH_START_X) / MOUTH_PIXEL_WIDTH);
const MOUTH_PIXEL_COLS = Array.from({ length: MOUTH_COL_COUNT }, (_, i) => {
  const x = MOUTH_START_X + i * MOUTH_PIXEL_WIDTH;
  return { x, y: mouthCurveY(x) };
});

export function VistaNuvi() {
  return (
    <div className="relative w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 flex items-center justify-center">
      {/* soft glow around the ring */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-70 animate-[spin_6s_linear_infinite]"
        style={{
          background:
            'conic-gradient(from 0deg, #bbf7d0, #4ade80, #16a34a, #4ade80, #bbf7d0)',
        }}
      />

      {/* outer ring (transparent center, white band) */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'rgba(255,255,255,0.35)',
          WebkitMask:
            'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))',
        }}
      />

      {/* sphere (solid, digital blue) */}
      <div
        className="relative w-[90%] h-[90%] rounded-full border border-green-300/50 flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.35)' }}
      >
        {/* face (emoji style, smiling) */}
        <svg
          viewBox="0 0 120 90"
          className="w-32 h-auto md:w-40 lg:w-44"
        >
          {/* eyes (pixel oval) */}
          {EYE_PIXEL_ROWS.map((r) => (
            <rect key={`el-${r.y}`} x={28 - r.w / 2} y={r.y} width={r.w} height={EYE_ROW_HEIGHT} fill="#27272a" />
          ))}
          {EYE_PIXEL_ROWS.map((r) => (
            <rect key={`er-${r.y}`} x={92 - r.w / 2} y={r.y} width={r.w} height={EYE_ROW_HEIGHT} fill="#27272a" />
          ))}
          {/* pupils (highlight) */}
          <rect x={25} y={13} width={4} height={4} fill="white" />
          <rect x={89} y={13} width={4} height={4} fill="white" />
          {/* mouth (pixel smile) */}
          {MOUTH_PIXEL_COLS.map((c) => (
            <rect key={`m-${c.x}`} x={c.x} y={c.y} width={MOUTH_PIXEL_WIDTH} height={MOUTH_PIXEL_HEIGHT} fill="#27272a" />
          ))}
        </svg>
      </div>
    </div>
  )
}
