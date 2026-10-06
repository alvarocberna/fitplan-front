'use client'
//shared
import { Modal, LoginOptions } from '@/shared'

interface LoginModalProps {
    open: boolean
    onClose: () => void
    //ruta a la que volver tras registrarse o iniciar sesión
    returnTo: string
}

// Ventana de registro/inicio de sesión que aparece al pagar sin sesión: las mismas opciones que la
// página /login (LoginOptions), pero sin sacar al usuario del carro hasta que elige una.
export function LoginModal({ open, onClose, returnTo }: LoginModalProps) {
    return (
        <Modal open={open} onClose={onClose} title="Inicia sesión para continuar">
            <p className="text-sm text-zinc-600">
                Para pagar tu plan necesitas una cuenta: así podrás verlo siempre en tu perfil. Al terminar volverás a tu carro.
            </p>
            <LoginOptions returnTo={returnTo} />
        </Modal>
    )
}
