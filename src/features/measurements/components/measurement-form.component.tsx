'use client'
//next
import { useRouter } from 'next/navigation'
//react
import { useForm, SubmitHandler, UseFormRegister } from 'react-hook-form'
//toast
import { toast } from 'react-toastify'
//shared
import { InputOutlined } from '@/shared'
//features - measurements
import { MeasurementsService } from '../services/measurements.service'
import {
    MeasurementDetailDto,
    MeasurementValueDto,
    MeasurementValueUnit,
    RecordMeasurementDto,
} from '../dtos/measurement.dto'
import { LEVEL_LABELS } from '../labels'

interface MeasurementFormProps {
    // Sin medición: registrar una nueva (POST). Con medición: corregirla (PATCH), sin cambiar el tipo.
    measurement?: MeasurementDetailDto
}

interface MeasurementFormValues {
    level: string
    measuredAt: string // datetime-local (hora local)
    weight: string
    height: string
    bodyFatValue: string
    bodyFatUnit: MeasurementValueUnit
    muscleMassValue: string
    muscleMassUnit: MeasurementValueUnit
}

// yyyy-MM-ddTHH:mm en hora local, el formato de <input type="datetime-local">.
function toLocalInput(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    return local.toISOString().slice(0, 16)
}

// Valor guardado de grasa o masa muscular (en la unidad en que se registró) para precargar el form.
function storedValue(measurement: MeasurementDetailDto | undefined, prefix: 'BODY_FAT' | 'MUSCLE_MASS') {
    const percentage = measurement?.results.find((r) => r.indicator === `${prefix}_PERCENTAGE`)
    if (percentage) return { value: String(percentage.value), unit: 'PERCENTAGE' as const }
    const kg = measurement?.results.find((r) => r.indicator === `${prefix}_KG`)
    if (kg) return { value: String(kg.value), unit: 'KG' as const }
    return { value: '', unit: 'PERCENTAGE' as const }
}

// Registra o corrige una medición (HU-CLI-05 / HU-CLI-06). Básica: peso y talla; bioimpedancia:
// además grasa corporal y masa muscular, cada una en % o kg. La fecha no puede ser futura. El
// backend repite todas las validaciones.
export function MeasurementForm({ measurement }: MeasurementFormProps) {
    const router = useRouter()
    const isEdit = Boolean(measurement)
    const bodyFat = storedValue(measurement, 'BODY_FAT')
    const muscleMass = storedValue(measurement, 'MUSCLE_MASS')

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<MeasurementFormValues>({
        defaultValues: {
            level: measurement?.level ?? 'BASIC',
            measuredAt: toLocalInput(measurement ? new Date(measurement.measuredAt) : new Date()),
            weight: measurement?.raw.basic?.weight != null ? String(measurement.raw.basic.weight) : '',
            height: measurement?.raw.basic?.height != null ? String(measurement.raw.basic.height) : '',
            bodyFatValue: bodyFat.value,
            bodyFatUnit: bodyFat.unit,
            muscleMassValue: muscleMass.value,
            muscleMassUnit: muscleMass.unit,
        },
    })
    const isBioimpedance = watch('level') === 'BIOIMPEDANCE'

    const onSubmit: SubmitHandler<MeasurementFormValues> = async (data) => {
        const values = {
            measuredAt: new Date(data.measuredAt).toISOString(),
            weight: Number(data.weight),
            height: Number(data.height),
            ...(isBioimpedance && {
                bodyFat: { value: Number(data.bodyFatValue), unit: data.bodyFatUnit } satisfies MeasurementValueDto,
                muscleMass: { value: Number(data.muscleMassValue), unit: data.muscleMassUnit } satisfies MeasurementValueDto,
            }),
        }
        try {
            const saved = measurement
                ? await MeasurementsService.updateMeasurement(measurement.measurementId, values)
                : await MeasurementsService.recordMeasurement({
                      ...values,
                      level: data.level as RecordMeasurementDto['level'],
                  })
            toast.success(isEdit ? 'Medición actualizada' : 'Medición registrada')
            router.push(`/panel/mediciones/${saved.measurementId}`)
            router.refresh()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'No se pudo guardar la medición')
        }
    }

    const requiredNumber = (min: number, max: number, label: string) => ({
        required: 'Campo requerido',
        validate: (value: string) => {
            const number = Number(value)
            return (number >= min && number <= max) || `${label} debe estar entre ${min} y ${max}`
        },
    })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full m-auto" noValidate>
            <SelectField
                label="Tipo de medición"
                name="level"
                register={register}
                disabled={isEdit}
                options={
                    isEdit && measurement?.level && !['BASIC', 'BIOIMPEDANCE'].includes(measurement.level)
                        ? [measurement.level]
                        : ['BASIC', 'BIOIMPEDANCE']
                }
                labels={LEVEL_LABELS}
            />

            <InputOutlined
                label="Fecha y hora de la medición"
                name="measuredAt"
                type="datetime-local"
                register={register}
                rules={{
                    required: 'Campo requerido',
                    validate: (value: string) =>
                        new Date(value).getTime() <= Date.now() || 'La fecha no puede ser futura',
                }}
            />
            {errors.measuredAt && <span className="text-red-400 text-sm">{errors.measuredAt.message}</span>}

            <InputOutlined label="Peso (kg)" name="weight" type="number" register={register} rules={requiredNumber(20, 300, 'El peso')} />
            {errors.weight && <span className="text-red-400 text-sm">{errors.weight.message}</span>}

            <InputOutlined label="Talla (cm)" name="height" type="number" register={register} rules={requiredNumber(100, 250, 'La talla')} />
            {errors.height && <span className="text-red-400 text-sm">{errors.height.message}</span>}

            {isBioimpedance && (
                <>
                    <ValueWithUnit label="Grasa corporal" name="bodyFat" register={register} />
                    {errors.bodyFatValue && <span className="text-red-400 text-sm">{errors.bodyFatValue.message}</span>}

                    <ValueWithUnit label="Masa muscular" name="muscleMass" register={register} />
                    {errors.muscleMassValue && <span className="text-red-400 text-sm">{errors.muscleMassValue.message}</span>}
                </>
            )}

            <div className="w-50 h-10 mx-auto mt-10">
                <input
                    className="primary-btn"
                    type="submit"
                    value={isEdit ? 'Guardar cambios' : 'Registrar medición'}
                    disabled={isSubmitting}
                />
            </div>
        </form>
    )
}

const SELECT_CLASS =
    'block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-800 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed'
const SELECT_LABEL_CLASS =
    'absolute text-sm text-zinc-700 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] px-2 start-1'

function SelectField({
    label,
    name,
    register,
    options,
    labels,
    disabled = false,
}: {
    label: string
    name: keyof MeasurementFormValues
    register: UseFormRegister<MeasurementFormValues>
    options: string[]
    labels: Record<string, string>
    disabled?: boolean
}) {
    return (
        <div className="relative w-full mt-3">
            <select {...register(name)} id={name} disabled={disabled} className={SELECT_CLASS}>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {labels[option] ?? option}
                    </option>
                ))}
            </select>
            <label htmlFor={name} className={SELECT_LABEL_CLASS}>
                {label}
            </label>
        </div>
    )
}

// Valor numérico + unidad (% o kg) de grasa corporal o masa muscular.
function ValueWithUnit({
    label,
    name,
    register,
}: {
    label: string
    name: 'bodyFat' | 'muscleMass'
    register: UseFormRegister<MeasurementFormValues>
}) {
    return (
        <div className="w-full flex gap-3 items-end">
            <div className="flex-1">
                <InputOutlined
                    label={label}
                    name={`${name}Value`}
                    type="number"
                    register={register}
                    rules={{
                        required: 'Campo requerido',
                        validate: (value: string) => Number(value) > 0 || `${label} debe ser mayor que 0`,
                    }}
                />
            </div>
            <div className="w-28">
                <SelectField
                    label="Unidad"
                    name={`${name}Unit`}
                    register={register}
                    options={['PERCENTAGE', 'KG']}
                    labels={{ PERCENTAGE: '%', KG: 'kg' }}
                />
            </div>
        </div>
    )
}
