'use client'

import { useEffect, useRef, type CSSProperties } from 'react'

// ojos: fila por fila a partir de una elipse, para un óvalo pixelado fino
const EYE_SIZE_SCALE = 1.25; // tamaño del ojo (y de la pupila) respecto a la base original
const EYE_ROW_HEIGHT = 1.35;
const EYE_CENTER_Y = 22;
const EYE_RADIUS_X = 10.5 * EYE_SIZE_SCALE;
const EYE_RADIUS_Y = 13.5 * EYE_SIZE_SCALE;
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

// cada ojo tiene su propia posición base sobre la "esfera" (capa 2)
const EYE_SOCKETS = [
  { side: -1, cx: 28 },
  { side: 1, cx: 92 },
] as const;

// --- ciclo de animación: seguir mouse (5s) -> parpadeo (5s) -> aburrido (5s) ---
const PHASE_DURATION = 5;
const PHASES = ['track', 'blink', 'bored'] as const;
type Phase = (typeof PHASES)[number];

// mirada -> posición/forma del ojo, en base a z = sqrt(1 - x² - y²) (frontalidad)
const EYE_LOCAL_X = 0.34; // posición base de cada ojo en la esfera (-1..1)
const GAZE_INFLUENCE_X = 0.55;
const GAZE_INFLUENCE_Y = 0.5;
const MIN_Z = 0.25; // evita que el ojo colapse en los extremos

const EYE_MOVE_X = 9; // rango de traslado del ojo (unidades svg)
const EYE_MOVE_Y = 4.5;
const SOCKET_SHIFT = 3.5; // separación entre ojos (varía por ojo según su z)
const EYE_SCALE_MIN = 0.68; // compresión de ancho al girar (volumen)

const PUPIL_MOVE_X = 3.4; // capa 3: movimiento propio, más pequeño que el del ojo
const PUPIL_MOVE_Y = 2.1;

const MOUTH_MOVE_X = 5.5; // capa 4: la boca se mueve como un punto más de la esfera
const MOUTH_MOVE_Y = 2.6;
const MOUTH_SCALE_MIN = 0.85; // leve compresión al girar, igual que los ojos

const EYE_LERP = 0.1; // retraso de los ojos al seguir el mouse
const PUPIL_LERP = 0.22; // la pupila reacciona más rápido que el ojo

const BORED_GY = -0.72; // "aburrido": mirar hacia arriba
const PROXIMITY_RADIUS_FACTOR = 1.6; // acercarse retoma el seguimiento

// el parpadeo corre en su propio reloj continuo, independiente de la fase de mirada,
// para que ocurra en las 3 fases del ciclo (track / centrado / aburrido) y no solo en una
const BLINK_CYCLE_DURATION = 5; // s, se repite indefinidamente
const BLINK_HALF_DURATION = 0.11; // s, medio pestañeo
const EYE_CLOSED_SCALE = 0.06;
const BLINK_EVENTS = [2, 4, 4.28]; // parpadeo simple a los 2s, doble a los 4s (dentro de cada ciclo)

// pupila: tamaño y posición escalan junto con el ojo (EYE_SIZE_SCALE)
const PUPIL_SIZE = 4 * EYE_SIZE_SCALE;
const PUPIL_CENTER_OFFSET_X = -1 * EYE_SIZE_SCALE; // relativo al centro del ojo (cx)
const PUPIL_CENTER_OFFSET_Y = -7 * EYE_SIZE_SCALE; // relativo a EYE_CENTER_Y

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function nextPhase(p: Phase): Phase {
  return PHASES[(PHASES.indexOf(p) + 1) % PHASES.length];
}

function getBlinkCloseAmount(cycleElapsed: number) {
  let closeAmt = 0;
  for (const te of BLINK_EVENTS) {
    const dt = Math.abs(cycleElapsed - te);
    if (dt < BLINK_HALF_DURATION) {
      closeAmt = Math.max(closeAmt, 1 - dt / BLINK_HALF_DURATION);
    }
  }
  return closeAmt;
}

export function VistaNuvi() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const eyeRefs = useRef<Record<number, SVGGElement | null>>({});
  const pupilRefs = useRef<Record<number, SVGGElement | null>>({});
  const mouthRef = useRef<SVGGElement | null>(null);

  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const phaseRef = useRef<Phase>('track');
  const phaseStartRef = useRef(0);
  const startTimeRef = useRef(0);
  const gazeRef = useRef({ x: 0, y: 0 });
  const pupilGazeRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    phaseStartRef.current = performance.now();
    startTimeRef.current = performance.now();

    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let rafId: number;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const radius = rect.width / 2;
      const cx = rect.left + radius;
      const cy = rect.top + radius;
      const mouse = mouseRef.current;
      const dist = mouse ? Math.hypot(mouse.x - cx, mouse.y - cy) : Infinity;

      // acercarse lo suficiente retoma el seguimiento y el ciclo continúa desde ahí
      if (dist < radius * PROXIMITY_RADIUS_FACTOR && phaseRef.current !== 'track') {
        phaseRef.current = 'track';
        phaseStartRef.current = now;
      }

      let elapsed = (now - phaseStartRef.current) / 1000;
      if (elapsed >= PHASE_DURATION) {
        phaseRef.current = nextPhase(phaseRef.current);
        phaseStartRef.current = now;
        elapsed = 0;
      }

      const phase = phaseRef.current;
      let targetX = 0;
      let targetY = 0;

      if (phase === 'track' && mouse) {
        let nx = clamp((mouse.x - cx) / radius, -1, 1);
        let ny = clamp((mouse.y - cy) / radius, -1, 1);
        const mag = Math.hypot(nx, ny);
        if (mag > 1) { nx /= mag; ny /= mag; }
        targetX = nx;
        targetY = ny;
      } else if (phase === 'bored') {
        targetX = Math.sin(now / 900) * 0.06; // leve deriva, sensación de aburrimiento
        targetY = BORED_GY;
      }
      // fase 'blink': el objetivo permanece en (0,0), la mirada vuelve al frente

      gazeRef.current.x = lerp(gazeRef.current.x, targetX, EYE_LERP);
      gazeRef.current.y = lerp(gazeRef.current.y, targetY, EYE_LERP);
      pupilGazeRef.current.x = lerp(pupilGazeRef.current.x, targetX, PUPIL_LERP);
      pupilGazeRef.current.y = lerp(pupilGazeRef.current.y, targetY, PUPIL_LERP);

      const blinkCycleElapsed = ((now - startTimeRef.current) / 1000) % BLINK_CYCLE_DURATION;
      const blinkClose = getBlinkCloseAmount(blinkCycleElapsed);
      const blinkScaleY = 1 - blinkClose * (1 - EYE_CLOSED_SCALE);

      const gx = gazeRef.current.x;
      const gy = gazeRef.current.y;
      const pgx = pupilGazeRef.current.x;
      const pgy = pupilGazeRef.current.y;

      for (const socket of EYE_SOCKETS) {
        // z = sqrt(1 - x² - y²): frontalidad de ese punto de la esfera
        const effX = clamp(socket.side * EYE_LOCAL_X + gx * GAZE_INFLUENCE_X, -0.95, 0.95);
        const effY = clamp(gy * GAZE_INFLUENCE_Y, -0.95, 0.95);
        const z = Math.sqrt(Math.max(MIN_Z, 1 - effX * effX - effY * effY));

        const eyeDx = gx * EYE_MOVE_X * z - socket.side * (1 - z) * SOCKET_SHIFT;
        const eyeDy = gy * EYE_MOVE_Y * z;
        const scaleX = EYE_SCALE_MIN + (1 - EYE_SCALE_MIN) * z;

        const eyeEl = eyeRefs.current[socket.side];
        if (eyeEl) {
          eyeEl.style.transform = `translate(${eyeDx}px, ${eyeDy}px) scaleX(${scaleX}) scaleY(${blinkScaleY})`;
        }

        const pupilEl = pupilRefs.current[socket.side];
        if (pupilEl) {
          pupilEl.style.transform = `translate(${pgx * PUPIL_MOVE_X}px, ${pgy * PUPIL_MOVE_Y}px)`;
        }
      }

      // capa 4 - boca: se mueve como un punto más de la esfera, siguiendo la misma mirada
      {
        const effX = clamp(gx * GAZE_INFLUENCE_X, -0.95, 0.95);
        const effY = clamp(gy * GAZE_INFLUENCE_Y, -0.95, 0.95);
        const z = Math.sqrt(Math.max(MIN_Z, 1 - effX * effX - effY * effY));

        const mouthDx = gx * MOUTH_MOVE_X * z;
        const mouthDy = gy * MOUTH_MOVE_Y * z;
        const mouthScaleX = MOUTH_SCALE_MIN + (1 - MOUTH_SCALE_MIN) * z;

        if (mouthRef.current) {
          mouthRef.current.style.transform = `translate(${mouthDx}px, ${mouthDy}px) scaleX(${mouthScaleX})`;
        }
      }

      // capa de iluminación: el brillo se desplaza levemente con la mirada
      if (sphereRef.current) {
        sphereRef.current.style.setProperty('--hl-x', `${38 + gx * 9}%`);
        sphereRef.current.style.setProperty('--hl-y', `${30 + gy * 9}%`);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 flex items-center justify-center">
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

      {/* capa 1 - esfera: no se mueve, solo la iluminación se desplaza levemente para dar volumen */}
      <div
        ref={sphereRef}
        className="relative w-[90%] h-[90%] rounded-full border border-green-300/50 flex items-center justify-center"
        style={{
          '--hl-x': '38%',
          '--hl-y': '30%',
          background:
            'radial-gradient(circle at var(--hl-x) var(--hl-y), rgba(255,255,255,0.65), rgba(255,255,255,0.3) 40%, rgba(134,239,172,0.22) 70%, rgba(6,78,45,0.28) 100%)',
        } as CSSProperties}
      >
        {/* face (emoji style, smiling) */}
        <svg viewBox="0 0 120 90" className="w-32 h-auto md:w-40 lg:w-44">
          {EYE_SOCKETS.map((socket) => (
            // capa 2 - ojo: se traslada, escala y comprime siguiendo la mirada
            <g
              key={`eye-${socket.side}`}
              ref={(el) => { eyeRefs.current[socket.side] = el; }}
              style={{ transformOrigin: `${socket.cx}px ${EYE_CENTER_Y}px` }}
            >
              {EYE_PIXEL_ROWS.map((r) => (
                <rect
                  key={`e-${socket.side}-${r.y}`}
                  x={socket.cx - r.w / 2}
                  y={r.y}
                  width={r.w}
                  height={EYE_ROW_HEIGHT}
                  fill="#27272a"
                />
              ))}
              {/* capa 3 - pupila: movimiento adicional, propio y más pequeño, dentro del ojo */}
              <g
                ref={(el) => { pupilRefs.current[socket.side] = el; }}
                style={{
                  transformOrigin: `${socket.cx + PUPIL_CENTER_OFFSET_X}px ${EYE_CENTER_Y + PUPIL_CENTER_OFFSET_Y}px`,
                }}
              >
                <rect
                  x={socket.cx + PUPIL_CENTER_OFFSET_X - PUPIL_SIZE / 2}
                  y={EYE_CENTER_Y + PUPIL_CENTER_OFFSET_Y - PUPIL_SIZE / 2}
                  width={PUPIL_SIZE}
                  height={PUPIL_SIZE}
                  fill="white"
                />
              </g>
            </g>
          ))}

          {/* capa 4 - boca: forma fija por ahora (sonrisa), se mueve igual que los ojos */}
          <g ref={mouthRef} style={{ transformOrigin: '60px 70px' }}>
            {MOUTH_PIXEL_COLS.map((c) => (
              <rect key={`m-${c.x}`} x={c.x} y={c.y} width={MOUTH_PIXEL_WIDTH} height={MOUTH_PIXEL_HEIGHT} fill="#27272a" />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
