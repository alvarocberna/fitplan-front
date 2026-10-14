'use client'
//next
import { useRouter } from "next/navigation";
//react
import { useForm, SubmitHandler } from "react-hook-form"
//features
import { FormPersonalInfoInterface } from "@/features";
//shared
import {useConsultation, InputOutlined, notifyError, unwrap} from '@/shared';
import { updateProfileAction, type PerfilStatus } from '@/shared/auth/profile.actions';


interface FormUserInfoProps {
    profile: PerfilStatus | null
    //a dónde ir tras guardar: el siguiente paso de la consulta, o /inicio si se llegó solo a completar datos
    nextHref?: string
}

//nivel deportivo elegido en el select "Deportista"; solo 'professional' marca al usuario como athlete
type SportLevel = 'none' | 'recreational' | 'professional'
type FormUserInfoValues = Omit<FormPersonalInfoInterface, 'athlete'> & { sportLevel: SportLevel }

export function FormUserInfo({ profile, nextHref = '/consulta/anamnesis' }: FormUserInfoProps) {
    //router
    const router = useRouter();
    //llamamos al estado de PersonalInfo desde el context
    const { setPersonalInfo } = useConsultation();
    //hook useForm destructuring — pre-llenado con lo que el backend ya conoce del perfil
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm<FormUserInfoValues>({
        defaultValues: {
            firstName: profile?.firstName ?? undefined,
            paternalLastName: profile?.paternalLastName ?? undefined,
            gender: profile?.gender ?? undefined,
            email: profile?.email ?? undefined,
            //el backend solo guarda un booleano: un "recreacional" previo se muestra como "No" (ambos son false)
            sportLevel: profile?.athlete ? 'professional' : 'none',
            dateOfBirth: profile?.dateOfBirth ? (profile.dateOfBirth.slice(0, 10) as unknown as Date) : undefined,
        },
    })

    //on submit: persiste el perfil en el backend (User, incluido athlete) antes de avanzar
    const onSubmit: SubmitHandler<FormUserInfoValues> = async (data) => {
        const athlete = data.sportLevel === 'professional'
        const result = await updateProfileAction({
            firstName: data.firstName,
            paternalLastName: data.paternalLastName,
            gender: data.gender,
            dateOfBirth: new Date(data.dateOfBirth).toISOString(),
            athlete,
        })

        try {
            unwrap(result)
        } catch (error) {
            //sesión vencida -> login; el resto, toast con el mensaje del backend
            notifyError(error, 'No se pudo guardar tu información')
            return
        }

        setPersonalInfo({
            rut: null,
            dvRut: null,
            middleName: null,
            maternalLastName: null,
            firstName: data.firstName,
            paternalLastName: data.paternalLastName,
            gender: data.gender,
            athlete,
            email: profile?.email ?? data.email,
            dateOfBirth: data.dateOfBirth,
        })
        router.push(nextHref); //enviamos al siguiente paso
    }

    return (
    <>
    {/* "handleSubmit" valida los inputs antes de invocar "onSubmit" */}
    <form onSubmit={handleSubmit(onSubmit)} className="w-full m-auto">

        {/* primer nombre */}
        <InputOutlined label="Primer nombre" name="firstName" type="text" register={register} rules={{ required: 'Campo requerido' }}/>
        {errors.firstName && <span className="text-red-400 text-sm">{errors.firstName.message}</span>}

        {/* appellido paterno */}
        <InputOutlined label="Apellido paterno" name="paternalLastName" type="text" register={register} rules={{ required: 'Campo requerido' }}/>
        {errors.paternalLastName && <span className="text-red-400 text-sm">{errors.paternalLastName.message}</span>}

        {/* Genero */}
        <div className="relative w-full mt-3">
            <select
            {...register("gender", {required: true, validate: (value) => ["MASCULINO", "FEMENINO"].includes(value) || "Valor debe ser Masculino o Femenino" })}
                id="floating-outlined"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-800 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer"
                defaultValue={profile?.gender ?? ""}
            >
                {/* <option value="" disabled hidden></option> */}
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
            </select>
            <label
                className="absolute text-sm text-zinc-700 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] px-2
                peer-focus:px-2 peer-focus:text-primary
                peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2
                peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1"
            >
                Género
            </label>
        </div>

        {/* Deportista — solo profesional/alto rendimiento marca user.athlete = true */}
        <div className="relative w-full mt-3">
            <select
            {...register("sportLevel")}
                id="floating-outlined-deportista"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-800 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer"
            >
                <option value="none">No, no hago ningún deporte</option>
                <option value="recreational">Sí, de forma recreacional o como hobby</option>
                <option value="professional">Sí, de forma profesional o alto rendimiento</option>
            </select>
            <label
                className="absolute text-sm text-zinc-700 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] px-2
                peer-focus:px-2 peer-focus:text-primary
                peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2
                peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1"
            >
                Deportista
            </label>
        </div>

        {/* correo — de solo lectura: siempre el de la cuenta con la que se inició sesión */}
        <InputOutlined label="Correo" name="email" type="email" register={register} disabled/>

        {/* celular */}
        {/* <InputOutlined label="Celular" name="celular" type="number" register={register} rules={{ required: false }}/> */}

        {/* fecha nacimiento */}
        <InputOutlined label="Fecha nacimiento" name="dateOfBirth" type="date" register={register} rules={{ required: 'Campo requerido' }}/>
        {errors.dateOfBirth && <span className="text-red-400 text-sm">Campo requerido</span>}

       <div className='w-50 h-10 mx-auto mt-10'>
            <input className='primary-btn' type='submit' value='Siguiente' disabled={isSubmitting}/>
        </div>

    </form>

    </>
  )
}
