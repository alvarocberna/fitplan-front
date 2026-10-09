'use client'
//REACT
import { useState, useRef, useEffect } from 'react'
//NEXT
import Image from "next/image";
//FONTAWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleChevronRight, faCircleChevronLeft, faXmark } from '@fortawesome/free-solid-svg-icons'
//PUBLIC
import PlanEjemplo1 from '../../../../public/images/plan-ejemplo/plan-fitplan-page-001.jpg'
import PlanEjemplo2 from '../../../../public/images/plan-ejemplo/plan-fitplan-page-002.jpg'
import PlanEjemplo3 from '../../../../public/images/plan-ejemplo/plan-fitplan-page-003.jpg'
import PlanEjemplo4 from '../../../../public/images/plan-ejemplo/plan-fitplan-page-004.jpg'
import PlanEjemplo5 from '../../../../public/images/plan-ejemplo/plan-fitplan-page-005.jpg'
import PlanEjemplo6 from '../../../../public/images/plan-ejemplo/plan-fitplan-page-006.jpg'
import PlanEjemplo7 from '../../../../public/images/plan-ejemplo/plan-fitplan-page-007.jpg'


const IMAGES = [PlanEjemplo1, PlanEjemplo2, PlanEjemplo3, PlanEjemplo4, PlanEjemplo5, PlanEjemplo6, PlanEjemplo7]
// const DEFAULT_TILT = { x: 8, y: 18, z: 2 }
const DEFAULT_TILT = { x: 4, y: -16, z: 2 }
const CARD_W = 280
const CARD_H = 380


export function Guideline() {
  const [imgIndex, setImgIndex] = useState(0)
  const [tilt, setTilt] = useState(DEFAULT_TILT)
  const [isGrabbing, setIsGrabbing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const isDragging = useRef(false)
  const hasDragged = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const startTilt = useRef({ ...DEFAULT_TILT })

  useEffect(() => {
    const onMouseMove = (e: any) => {
      if (!isDragging.current) return
      const dx = e.clientX - startPos.current.x
      const dy = e.clientY - startPos.current.y
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDragged.current = true
      setTilt({
        x: Math.max(-45, Math.min(45, startTilt.current.x - dy * 0.35)),
        y: Math.max(-55, Math.min(55, startTilt.current.y + dx * 0.35)),
        z: DEFAULT_TILT.z,
      })
    }
    const onMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      setIsGrabbing(false)
      if (!hasDragged.current) setIsModalOpen(true)
      setTilt(DEFAULT_TILT)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  useEffect(() => {
    if (!isModalOpen) return
    const onKeyDown = (e: any) => { if (e.key === 'Escape') setIsModalOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isModalOpen])

  const onMouseDown = (e: any) => {
    isDragging.current = true
    hasDragged.current = false
    setIsGrabbing(true)
    startPos.current = { x: e.clientX, y: e.clientY }
    startTilt.current = { ...tilt }
    e.preventDefault()
  }

  const onTouchStart = (e: any) => {
    isDragging.current = true
    hasDragged.current = false
    startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    startTilt.current = { ...tilt }
  }

  const onTouchMove = (e: any) => {
    if (!isDragging.current) return
    const dx = e.touches[0].clientX - startPos.current.x
    const dy = e.touches[0].clientY - startPos.current.y
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDragged.current = true
    setTilt({
      x: Math.max(-45, Math.min(45, startTilt.current.x - dy * 0.35)),
      y: Math.max(-55, Math.min(55, startTilt.current.y + dx * 0.35)),
      z: DEFAULT_TILT.z,
    })
  }

  const onTouchEnd = () => {
    isDragging.current = false
    if (!hasDragged.current) setIsModalOpen(true)
    setTilt(DEFAULT_TILT)
  }

  const goNext = () => setImgIndex(i => (i + 1) % IMAGES.length)
  const goPrev = () => setImgIndex(i => (i - 1 + IMAGES.length) % IMAGES.length)

  const shadow = [
    `${-tilt.y * 0.55}px ${-tilt.x * 0.55}px 30px color-mix(in srgb, var(--color-primary) 15%, transparent)`,
    `${tilt.y * 0.2}px ${tilt.x * 0.2}px 20px color-mix(in srgb, var(--color-primary) 15%, transparent)`,
  ].join(', ')

  return (
    <>
        <div className="m-auto w-full flex" 
        style={{ justifyContent: 'center', alignItems: 'center' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* left button */}
                <button className="hidden md:block" onClick={goPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    <FontAwesomeIcon style={{ width: '35px', fontSize: '35px', color: 'var(--color-primary)' }} icon={faCircleChevronLeft} />
                </button>
                {/* informe */}
                <div className="flex flex-col items-center">
                    <div style={{ perspective: '900px' }}>
                    <div
                        style={{
                        position: 'relative',
                        width: `${CARD_W}px`,
                        height: `${CARD_H}px`,
                        borderRadius: '14px',
                        overflow: 'hidden',
                        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateZ(${tilt.z}deg)`,
                        transition: isGrabbing ? 'none' : 'transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.65s ease',
                        boxShadow: shadow,
                        cursor: isGrabbing ? 'grabbing' : 'grab',
                        userSelect: 'none',
                        touchAction: 'none',
                        }}
                        onMouseDown={onMouseDown}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <Image
                        src={IMAGES[imgIndex]}
                        fill
                        alt="Pauta ejemplo"
                        draggable={false}
                        style={{ objectFit: 'cover' }}
                        />
                    </div>
                    </div>

                    {/* Botones móvil: debajo de la card, solo en xs */}
                    <div className="flex md:hidden justify-center mt-[26px]" style={{ gap: '50px' }}>
                        <button onClick={goPrev} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <FontAwesomeIcon style={{ width: '35px', fontSize: '35px', color: 'var(--color-primary)' }} icon={faCircleChevronLeft} />
                            <span className="visually-hidden"></span>
                        </button>
                        <button onClick={goNext} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <FontAwesomeIcon style={{ width: '35px', fontSize: '35px', color: 'var(--color-primary)' }} icon={faCircleChevronRight} />
                            <span className="visually-hidden"></span>
                        </button>
                    </div>
                </div>
                {/* right button */}
                <button className="hidden md:block" onClick={goNext} style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    <FontAwesomeIcon style={{ width: '35px', fontSize: '35px', color: 'var(--color-primary)' }} icon={faCircleChevronRight} />
                </button>
            </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{ position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={IMAGES[imgIndex]}
              alt="Informe antropometrico medición deportiva"
              width={700}
              height={900}
              style={{
                objectFit: 'contain',
                maxWidth: '90vw',
                maxHeight: '85vh',
                borderRadius: '14px',
                display: 'block',
              }}
            />
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '-14px',
                right: '-14px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                background: 'var(--color-primary)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                boxShadow: '0 4px 12px rgba(103, 61, 230, 0.5)',
              }}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
