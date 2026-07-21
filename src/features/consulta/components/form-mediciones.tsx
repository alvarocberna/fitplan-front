'use client'
//next
import { useRouter } from "next/navigation";
//react
import { useForm, SubmitHandler } from "react-hook-form";
//toast
import { toast } from 'react-toastify'
//shared
import { TitleSubSec, HeadSubSec, BodySubSec, Card, InputOutlined, useConsulta} from '@/shared'
//features
import { FormMedicionesInterface } from '@/features';


export function FormMediciones(){
    //router
    const router = useRouter();
    //llamamos al estado de InformacionPersonal y Anamnesis desde el context
    const { informacionPersonal, anamnesis, setMediciones } = useConsulta();
    //hook useForm destructuring
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormMedicionesInterface>()

    //on submit
    const onSubmit: SubmitHandler<FormMedicionesInterface> = async (data) => {
        if (!informacionPersonal || !anamnesis) {
            toast.error('Faltan datos de pasos anteriores');
            return;
        }
        //actualiza el estado de la propiedad mediciones del context
        setMediciones(data);

        //redirecciona a la ruta donde se genera el plan nutricional
        router.push('/consulta/finalizar');
    }

    return(
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <div className='m-auto w-full'>
                <TitleSubSec title="Mediciones básicas"/>
                <div className="grid grid-cols-2 gap-x-2 mb-6">
                    <InputOutlined label="Peso" name="peso" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Talla" name="talla" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    {/* <InputOutlined label="Talla sentado" name="mediciones.talla_sentado" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/> */}
                    {/* <InputOutlined label="Envergadura" name="mediciones.envergadura" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/> */}
                </div>
                {/* <TitleSubSec title="Pliegues"/>
                <div className="grid grid-cols-2 gap-x-2 mb-6">
                    <InputOutlined label="Tricep" name="mediciones.tricep" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Subescapular" name="mediciones.subescapular" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Bicep" name="mediciones.bicep" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Cresta Iliaca" name="mediciones.cresta_iliaca" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Supraespinal" name="mediciones.supraespinal" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Abdominal" name="mediciones.abdominal" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Muslo" name="mediciones.muslo" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Pierna" name="mediciones.pierna_pli" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                </div>
                <TitleSubSec title="Perímetros"/>
                <div className="grid grid-cols-2 gap-x-2 mb-6">
                    <InputOutlined label="Brazo Relajado" name="mediciones.brazo_relajado" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Brazo Flexionado" name="mediciones.brazo_flexionado" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Cintura" name="mediciones.cintura" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Cadera" name="mediciones.cadera" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Muslo Medio" name="mediciones.muslo_medio" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Pierna" name="mediciones.pierna_per" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                </div>
                <TitleSubSec title="Diámetros óseos"/>
                <div className="grid grid-cols-2 gap-x-2 mb-6">
                    <InputOutlined label="Humero" name="mediciones.humero" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Biestiloideo" name="mediciones.biestiloideo" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Femur" name="mediciones.femur" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                </div> */}
            </div>
                <div className='h-[40px]'></div>
            {/* </Card> */}
            <div className='w-1/2 h-[40px] mx-auto mt-5 mb-10'>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className='primary-btn'
                >
                    Finalizar consulta
                </button>
            </div>
        </form>
    )
}
