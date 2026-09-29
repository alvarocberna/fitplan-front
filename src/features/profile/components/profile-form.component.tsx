'use client'
//react
import { useForm, SubmitHandler } from "react-hook-form"
//toast
import { toast } from 'react-toastify'
//shared
import { InputOutlined } from '@/shared'
//features - profile
import { ProfileService } from '../services/profile.service'
import { UserProfileDto } from '../dtos/user-profile.dto'

interface ProfileFormProps {
    profile: UserProfileDto
}

interface ProfileFormValues {
    firstName: string
    paternalLastName: string
    dateOfBirth: string
    email: string
}

// Muestra y permite editar los datos básicos del User: nombre, apellido y fecha de nacimiento.
// El correo se muestra pero es de solo lectura (fijado al sincronizar la identidad de Cognito).
export function ProfileForm({ profile }: ProfileFormProps) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
        defaultValues: {
            firstName: profile.firstName ?? '',
            paternalLastName: profile.paternalLastName ?? '',
            dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '',
            email: profile.email ?? '',
        },
    })

    const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
        try {
            await ProfileService.updateProfile({
                firstName: data.firstName,
                paternalLastName: data.paternalLastName,
                dateOfBirth: new Date(data.dateOfBirth).toISOString(),
            })
            toast.success('Perfil actualizado correctamente')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el perfil')
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full m-auto">

            {/* nombre */}
            <InputOutlined label="Nombre" name="firstName" type="text" register={register} rules={{ required: 'Campo requerido' }} />
            {errors.firstName && <span className="text-red-400 text-sm">{errors.firstName.message}</span>}

            {/* apellido */}
            <InputOutlined label="Apellido" name="paternalLastName" type="text" register={register} rules={{ required: 'Campo requerido' }} />
            {errors.paternalLastName && <span className="text-red-400 text-sm">{errors.paternalLastName.message}</span>}

            {/* correo — de solo lectura */}
            <InputOutlined label="Correo" name="email" type="email" register={register} disabled />

            {/* fecha nacimiento */}
            <InputOutlined label="Fecha de nacimiento" name="dateOfBirth" type="date" register={register} rules={{ required: 'Campo requerido' }} />
            {errors.dateOfBirth && <span className="text-red-400 text-sm">{errors.dateOfBirth.message}</span>}

            {/* botón alineado a la derecha */}
            <div className='w-50 h-10 ml-auto mt-10'>
                <input className='primary-btn' type='submit' value='Guardar cambios' disabled={isSubmitting} />
            </div>

        </form>
    )
}
