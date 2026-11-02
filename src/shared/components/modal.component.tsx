'use client'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
    open: boolean
    onClose: () => void
    //se muestra como encabezado y nombra al diálogo para los lectores de pantalla
    title: string
    children: ReactNode
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Ventana modal accesible: se dibuja en un portal a document.body (así ningún ancestro con `transform`,
// como el carrusel de planes con GSAP, rompe su `position: fixed`), se cierra con Escape, con el fondo o
// con la X, bloquea el scroll de la página, mantiene el foco dentro mientras está abierta y lo devuelve
// al elemento que la abrió al cerrarse.
export function Modal({ open, onClose, title, children }: ModalProps) {
    const titleId = useId()
    const dialogRef = useRef<HTMLDivElement>(null)
    //onClose suele ser una función nueva en cada render del padre: se guarda en un ref para que el
    //efecto dependa solo de `open` y no vuelva a enfocar el diálogo (quitando el foco de un input) cada vez
    const onCloseRef = useRef(onClose)
    useEffect(() => {
        onCloseRef.current = onClose
    })

    useEffect(() => {
        if (!open) return
        const previouslyFocused = document.activeElement as HTMLElement | null
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        dialogRef.current?.focus()

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onCloseRef.current()
                return
            }
            if (event.key !== 'Tab' || !dialogRef.current) return
            const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
            if (focusable.length === 0) {
                event.preventDefault()
                return
            }
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }
        document.addEventListener('keydown', onKeyDown)

        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = previousOverflow
            previouslyFocused?.focus?.()
        }
    }, [open])

    if (!open || typeof document === 'undefined') return null

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            onClick={(event) => {
                //solo el clic directo sobre el fondo cierra; un clic dentro del diálogo no debe burbujear hasta acá
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl outline-none"
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="absolute right-4 top-3 text-2xl leading-none text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                    ×
                </button>
                <h2 id={titleId} className="mb-5 pr-6 text-xl font-bold text-zinc-800">
                    {title}
                </h2>
                {children}
            </div>
        </div>,
        document.body,
    )
}
