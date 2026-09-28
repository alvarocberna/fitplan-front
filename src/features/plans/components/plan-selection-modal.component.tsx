'use client'
//next
import { useRouter } from 'next/navigation'
//shared
import { Modal, usePlanSelection, isPlanSelectionComplete, isPlanSlug } from '@/shared'
//features - plans
import { PlanSelectionFields } from './plan-selection-fields.component'

// Modal que abre el botón "Seleccionar" de un plan (en el carrusel del home y en /planes-estandar): pide peso,
// talla, sexo y edad para elegir la versión del plan que mejor le corresponde al usuario. Al confirmar
// lo lleva a /planes-estandar/<plan>, donde ve la vista previa de su versión. Se monta una sola vez en el layout
// raíz; el plan para el que se abrió vive en el estado global (selectionModalSlug).
export function PlanSelectionModal() {
    const router = useRouter()
    const { selection, selectionModalSlug, closeSelectionModal } = usePlanSelection()
    const canConfirm = isPlanSelectionComplete(selection)

    const onConfirm = () => {
        if (!canConfirm || !selectionModalSlug || !isPlanSlug(selectionModalSlug)) return
        closeSelectionModal()
        router.push(`/planes-estandar/${selectionModalSlug}`)
    }

    return (
        <Modal
            open={selectionModalSlug !== null}
            onClose={closeSelectionModal}
            title="Completa tu información para obtener el plan más adecuado"
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault()
                    onConfirm()
                }}
                className="flex flex-col gap-6"
            >
                <PlanSelectionFields />
                <button
                    type="submit"
                    disabled={!canConfirm}
                    className="w-full py-2.5 rounded-full text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                >
                    Confirmar
                </button>
            </form>
        </Modal>
    )
}
