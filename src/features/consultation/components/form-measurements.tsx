'use client'
//next
import { useRouter } from "next/navigation";
//react
import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
//toast
import { toast } from 'react-toastify'
//shared
import { SubsectionTitle, InputOutlined, useConsultation} from '@/shared'
//features
import { ConsultationService, FormMeasurementsInterface, GoalNotFeasible, SomatotypeSelector } from '@/features';


export function FormMeasurements(){
    //router
    const router = useRouter();
    //llamamos al estado de PersonalInfo y Anamnesis desde el context
    const { personalInfo, anamnesis, setMeasurements, isHydrated } = useConsultation();
    //hook useForm destructuring
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormMeasurementsInterface>()
    //mensaje de CU-CON-03 cuando el objetivo no es factible (reemplaza al formulario)
    const [notFeasibleMessage, setNotFeasibleMessage] = useState<string | null>(null)

    //on submit
    const onSubmit: SubmitHandler<FormMeasurementsInterface> = async (data) => {
        if (!personalInfo || !anamnesis) {
            toast.error('Faltan datos de pasos anteriores');
            return;
        }
        //actualiza el estado de la propiedad measurements del context
        setMeasurements(data);

        //evalúa si el objetivo es alcanzable según el estado nutricional (ej. no se trabaja una
        //pérdida de peso con IMC <= 20) antes de pasar a generar la orden
        try {
            const feasibility = await ConsultationService.evaluateGoalFeasibility({
                goals: anamnesis.goals,
                measurements: { weight: data.weight, height: data.height },
            });
            if (!feasibility.feasible) {
                setNotFeasibleMessage(feasibility.message ?? 'Lo siento, tu objetivo no es adecuado para tu estado nutricional actual.');
                return;
            }
        } catch {
            toast.error('No pudimos evaluar tu objetivo, intenta nuevamente');
            return;
        }

        //redirecciona a la ruta donde se arma la orden y se realiza el pago
        router.push('/consulta/generar-orden');
    }

    if (notFeasibleMessage) {
        return <GoalNotFeasible message={notFeasibleMessage}/>
    }

    return(
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <div className='m-auto w-full'>
                <SubsectionTitle title="Mediciones básicas" bold={false}/>
                <div className="grid grid-cols-2 gap-x-2 mb-6">
                    <InputOutlined label="Peso" name="weight" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Talla" name="height" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    {/* <InputOutlined label="Talla sentado" name="measurements.sittingHeight" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/> */}
                    {/* <InputOutlined label="Envergadura" name="measurements.armSpan" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/> */}
                </div>
                <SubsectionTitle title="Contextura corporal" mb={4} bold={false}/>
                <SomatotypeSelector register={register} gender={personalInfo?.gender} loading={!isHydrated}/>
                {/* <TitleSubSec title="Pliegues"/>
                <div className="grid grid-cols-2 gap-x-2 mb-6">
                    <InputOutlined label="Tricep" name="measurements.triceps" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Subescapular" name="measurements.subscapular" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Bicep" name="measurements.biceps" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Cresta Iliaca" name="measurements.iliacCrest" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Supraespinal" name="measurements.supraspinal" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Abdominal" name="measurements.abdominal" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Muslo" name="measurements.thigh" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Pierna" name="measurements.calfSkinfold" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                </div>
                <TitleSubSec title="Perímetros"/>
                <div className="grid grid-cols-2 gap-x-2 mb-6">
                    <InputOutlined label="Brazo Relajado" name="measurements.relaxedArm" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Brazo Flexionado" name="measurements.flexedArm" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Cintura" name="measurements.waist" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Cadera" name="measurements.hip" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Muslo Medio" name="measurements.midThigh" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Pierna" name="measurements.calfGirth" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                </div>
                <TitleSubSec title="Diámetros óseos"/>
                <div className="grid grid-cols-2 gap-x-2 mb-6">
                    <InputOutlined label="Humero" name="measurements.humerus" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Biestiloideo" name="measurements.wristBreadth" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
                    <InputOutlined label="Femur" name="measurements.femur" type="number" register={register} rules={{ required: true, valueAsNumber: true }}/>
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
                    {isSubmitting ? 'Evaluando…' : 'Finalizar consulta'}
                </button>
            </div>
        </form>
    )
}