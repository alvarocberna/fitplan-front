const EYE_ROW_HEIGHT = 3;
const EYE_PIXEL_ROWS = [
  { w: 9, y: 8.5 },
  { w: 15, y: 11.5 },
  { w: 15, y: 14.5 },
  { w: 21, y: 17.5 },
  { w: 21, y: 20.5 },
  { w: 21, y: 23.5 },
  { w: 15, y: 26.5 },
  { w: 15, y: 29.5 },
  { w: 9, y: 32.5 },
];

const MOUTH_PIXEL_WIDTH = 6;
const MOUTH_PIXEL_HEIGHT = 8;
const MOUTH_PIXEL_COLS = [
  { x: 28, y: 60 },
  { x: 34, y: 64 },
  { x: 41, y: 68 },
  { x: 47, y: 72 },
  { x: 54, y: 72 },
  { x: 60, y: 72 },
  { x: 66, y: 72 },
  { x: 73, y: 72 },
  { x: 79, y: 68 },
  { x: 86, y: 64 },
  { x: 92, y: 60 },
];

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
