'use client'
//REACT
import { useState, useRef, type PointerEvent } from 'react'
//NEXT
import Image from "next/image";
//PUBLIC
import PlanEjemplo1 from '../../../../public/images/plan-ejemplo/plan-fitplan-page-001.jpg'
import PlanEjemplo2 from '../../../../public/images/plan-ejemplo/plan-fitplan-page-002.jpg'
import PlanEjemplo3 from '../../../../public/images/plan-ejemplo/plan-fitplan-page-003.jpg'
import PlanEjemplo4 from '../../../../public/images/plan-ejemplo/plan-fitplan-page-004.jpg'

// la primera página va al frente, 100% visible; las demás quedan detrás, de la más cercana a la más lejana
const PAGES = [PlanEjemplo1, PlanEjemplo2, PlanEjemplo3, PlanEjemplo4]
const PAGE_OFFSET = 10 // px que asoma cada página de atrás hacia la derecha y hacia arriba (la "pestaña")
const PAGE_DEPTH = 12 // px de separación en profundidad entre una página y la siguiente
const COLLAPSED_DEPTH = 0.5 // px entre páginas mientras están ocultas detrás de la portada (solo mantiene el orden)
const PAGE_LIFT = 12 // px que sube la página que tiene el mouse encima
const SPREAD_TRANSITION = '0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)' // despliegue / repliegue de las páginas
const PAGE_RADIUS = '14px'
const IMAGE_SIZES = '(min-width: 1280px) 268px, (min-width: 1024px) 224px, 180px'

// misma inclinación base que Guideline (guideline.component.tsx)
const DEFAULT_TILT = { x: 4, y: -16, z: 2 }
const DRAG_SENSITIVITY = 0.35 // grados por píxel arrastrado
const MAX_TILT_X = 45
const MAX_TILT_Y = 55

const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v))

// páginas del plan de ejemplo apiladas una detrás de otra, con inclinación 3D que se puede girar arrastrando
export function PlanPreview() {
  const [tilt, setTilt] = useState(DEFAULT_TILT)
  const [isGrabbing, setIsGrabbing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hoveredPage, setHoveredPage] = useState<number | null>(null)
  // mientras se arrastra, las páginas siguen desplegadas aunque el cursor salga de la pila
  const isExpanded = isHovered || isGrabbing
  const startPos = useRef({ x: 0, y: 0 })
  const startTilt = useRef({ ...DEFAULT_TILT })

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsGrabbing(true)
    startPos.current = { x: e.clientX, y: e.clientY }
    startTilt.current = { ...tilt }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isGrabbing) return
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    setTilt({
      x: clamp(startTilt.current.x - dy * DRAG_SENSITIVITY, MAX_TILT_X),
      y: clamp(startTilt.current.y + dx * DRAG_SENSITIVITY, MAX_TILT_Y),
      z: DEFAULT_TILT.z,
    })
  }

  // al soltar vuelve a la inclinación por defecto
  const onPointerEnd = () => {
    if (!isGrabbing) return
    setIsGrabbing(false)
    setTilt(DEFAULT_TILT)
  }

  const shadow = [
    `${-tilt.y * 0.55}px ${-tilt.x * 0.55}px 30px color-mix(in srgb, var(--color-primary) 15%, transparent)`,
    `${tilt.y * 0.2}px ${tilt.x * 0.2}px 20px color-mix(in srgb, var(--color-primary) 15%, transparent)`,
  ].join(', ')

  return (
    <div style={{ perspective: '900px' }}>
      <div
        className="relative w-45 lg:w-56 xl:w-67"
        style={{
          aspectRatio: `${PlanEjemplo1.width} / ${PlanEjemplo1.height}`,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateZ(${tilt.z}deg)`,
          transition: isGrabbing ? 'none' : 'transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          cursor: isGrabbing ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => { setIsHovered(false); setHoveredPage(null) }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {PAGES.map((page, index) => {
          const isFront = index === 0
          // sin el mouse encima las páginas de atrás quedan ocultas justo detrás de la portada
          const spread = isExpanded ? index : 0
          const depth = isExpanded ? index * PAGE_DEPTH : index * COLLAPSED_DEPTH
          return (
            // capa fija: es la que detecta el mouse, así la página puede levantarse sin salirse del cursor
            <div
              key={index}
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translate3d(${spread * PAGE_OFFSET}px, ${-spread * PAGE_OFFSET}px, ${-depth}px)`,
                opacity: isFront || isExpanded ? 1 : 0,
                transition: `transform ${SPREAD_TRANSITION}, opacity ${SPREAD_TRANSITION}`,
              }}
              onPointerEnter={() => setHoveredPage(index)}
              onPointerLeave={() => setHoveredPage((current) => (current === index ? null : current))}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: PAGE_RADIUS,
                  overflow: 'hidden',
                  transform: `translateY(${hoveredPage === index ? -PAGE_LIFT : 0}px)`,
                  // la sombra de color va solo en la página del frente; el borde fino separa cada página de la de atrás
                  boxShadow: isFront
                    ? `0 0 0 1px rgba(0, 0, 0, 0.06), ${shadow}`
                    : '0 0 0 1px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: `transform 0.25s ease${isGrabbing ? '' : ', box-shadow 0.65s ease'}`,
                }}
              >
                <Image
                  src={page}
                  fill
                  priority={isFront}
                  sizes={IMAGE_SIZES}
                  alt={isFront ? 'Ejemplo de plan nutricional Fitplan' : ''}
                  draggable={false}
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
