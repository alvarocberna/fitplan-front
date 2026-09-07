'use client'
//next
import { useRouter } from "next/navigation";
//react
import { useForm, SubmitHandler } from "react-hook-form"
//features
import { FormPersonalInfoInterface } from "@/features";
//shared
import {useConsultation, InputOutlined} from '@/shared';


export function FormUserInfo() {
    //router
    const router = useRouter();
    //llamamos al estado de PersonalInfo desde el context
    const { setPersonalInfo, personalInfo } = useConsultation();
    //hook useForm destructuring
    const { register, handleSubmit, formState: { errors }, } = useForm<FormPersonalInfoInterface>()

    //on submit
    const onSubmit: SubmitHandler<FormPersonalInfoInterface> = (data) => {
        setPersonalInfo(data) //actualizamos los datos del context
        router.push('/consulta/anamnesis'); //enviamos al siguiente paso
    }

    return (
    <>
    {/* "handleSubmit" valida los inputs antes de invocar "onSubmit" */}
    <form onSubmit={handleSubmit(onSubmit)} className="w-full m-auto">

        {/* rut */}
        <InputOutlined label="Rut" name="rut" type="number" register={register} rules={{ required: true, minLength: {value: 7, message: 'Rut demasiado corto'}, maxLength: {value: 8, message: 'Rut demasiado largo'} }}/>
        {errors.rut && <span className="text-red-400 text-sm">{errors.rut.message}</span>}

        {/* dv_rut */}
        <InputOutlined label="DV-Rut" name="dvRut" type="text" register={register} rules={{ required: true, maxLength: {value: 1, message: 'Largo exedido'} }}/>
        {errors.dvRut && <span className="text-red-400 text-sm">{errors.dvRut.message}</span>}

        {/* primer nombre */}
        <InputOutlined label="Primer nombre" name="firstName" type="text" register={register} rules={{ required: 'Campo requerido' }}/>
        {errors.firstName && <span className="text-red-400 text-sm">{errors.firstName.message}</span>}

        {/* segundo nombre */}
        <InputOutlined label="Segundo nombre" name="middleName" type="text" register={register} rules={{ required: false }}/>

        {/* appellido paterno */}
        <InputOutlined label="Apellido paterno" name="paternalLastName" type="text" register={register} rules={{ required: 'Campo requerido' }}/>
        {errors.paternalLastName && <span className="text-red-400 text-sm">{errors.paternalLastName.message}</span>}

        {/* Apellido materno */}
        <InputOutlined label="Apellido materno" name="maternalLastName" type="text" register={register} rules={{ required: false }}/>

        {/* Genero */}
        <div className="relative w-full mt-3">
            <select
            {...register("gender", {required: true, validate: (value) => ["MASCULINO", "FEMENINO"].includes(value) || "Valor debe ser Masculino o Femenino" })}
                id="floating-outlined"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-800 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer"
                defaultValue=""
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

        {/* Deportista */}
        <div className="relative w-full mt-3">
            <select
            {...register("athlete", {required: false, setValueAs: (value) => value === "true"})}
                id="floating-outlined-deportista"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-800 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer"
                defaultValue=""
            >
                <option value="false">No, no hago ningún deporte</option>
                <option value="false">Sí, de forma recreacional o como hobby</option>
                <option value="true">Sí, de forma profesional o alto rendimiento</option>
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

        {/* correo */}
        <InputOutlined label="Correo" name="email" type="email" register={register} rules={{ required: 'Campo requerido' }}/>
        {errors.email && <span className="text-red-400 text-sm">Campo requerido</span>}

        {/* celular */}
        {/* <InputOutlined label="Celular" name="celular" type="number" register={register} rules={{ required: false }}/> */}

        {/* fecha nacimiento */}
        <InputOutlined label="Fecha nacimiento" name="dateOfBirth" type="date" register={register} rules={{ required: 'Campo requerido' }}/>
        {errors.dateOfBirth && <span className="text-red-400 text-sm">Campo requerido</span>}

       <div className='w-50 h-10 mx-auto mt-10'>
            <input className='primary-btn' type='submit' value='Siguiente'/>
        </div>

    </form>

    </>
  )
}