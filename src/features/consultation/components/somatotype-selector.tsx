'use client'
//next
import Image from "next/image";
//react
import { UseFormRegister } from "react-hook-form";
//icons
import { InformationCircleIcon } from "@heroicons/react/24/outline";
//interfaces
import { FormMeasurementsInterface } from "@/features";

interface SomatotypeOption {
    value: string;
    maleFile: string;
    femaleFile: string;
    info: string;
}

//opciones ordenadas de izquierda a derecha: ecto, meso-ecto, meso, meso-endo, endo, endo-ecto
const SOMATOTYPE_OPTIONS: SomatotypeOption[] = [
    {
        value: "ECTO",
        maleFile: "hombre-ecto.png",
        femaleFile: "mujer-ecto.png",
        info: "Ectomorfo: Contextura delgada. Bajo o leve nivel de masa muscular y grasa corporal.",
    },
    {
        value: "MESOECTO",
        maleFile: "hombre-meso-ecto.png",
        femaleFile: "mujer-meso-ecto.png",
        info: "Meso-Ectomorfo: Contextura delgada musculosa. Moderado nivel de masa muscular y bajo nivel de grasa corporal.",
    },
    {
        value: "MESO",
        maleFile: "hombre-meso.png",
        femaleFile: "mujer-meso.png",
        info: "Mesomorfo: Contextura musculosa predominante. No predomina ni la delgadez ni la grasa corporal.",
    },
    {
        value: "MESOENDO",
        maleFile: "hombre-meso-endo.png",
        femaleFile: "mujer-meso-endo.png",
        info: "Meso-Endomorfo: Contextura robusta. Hay predominancia tanto de masa muscular como grasa corporal.",
    },
    {
        value: "ENDO",
        maleFile: "hombre-endo.png",
        femaleFile: "mujer-endo.png",
        info: "Endomorfo: Contextura redondeada. Mayor presencia de grasa corporal, con niveles bajos de masa muscular.",
    },
    {
        value: "ENDOECTO",
        maleFile: "hombre-endo-ecto.png",
        femaleFile: "mujer-endo-ecto.png",
        info: "Endo-Ectomorfo: Contextura delgada adiposa. Predomina la delgadez con leve-moderado nivel de grasa corporal y baja masa muscular.",
    },
];

interface SomatotypeSelectorProps {
    register: UseFormRegister<FormMeasurementsInterface>;
    gender?: string | null;
    //true mientras el estado persistido aún no termina de cargar en el cliente, para no mostrar la imagen de un género incorrecto
    loading?: boolean;
}

export function SomatotypeSelector({ register, gender, loading = false }: SomatotypeSelectorProps) {
    const isFemale = gender === "FEMENINO";

    return (
        <div className="mb-6">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {loading && SOMATOTYPE_OPTIONS.map((option) => (
                    <div key={option.value} className="flex w-full flex-col items-center rounded-xl border-2 border-gray-100 p-2">
                        <div className="aspect-[347/520] w-full animate-pulse rounded-lg bg-gray-200" />
                    </div>
                ))}
                {!loading && SOMATOTYPE_OPTIONS.map((option) => {
                    const file = isFemale ? option.femaleFile : option.maleFile;
                    const inputId = `somatotipo-${option.value}`;

                    return (
                        <div key={option.value} className="relative flex flex-col items-center">
                            <div className="group absolute top-0 right-0 z-20 mt-2 mr-2">
                                <InformationCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400 hover:text-primary cursor-help" />
                                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-36 sm:w-44 -translate-x-1/2 rounded-md bg-zinc-800 px-2 py-1.5 text-[10px] sm:text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-30">
                                    {option.info}
                                </div>
                            </div>

                            <input
                                type="radio"
                                id={inputId}
                                value={option.value}
                                className="peer sr-only"
                                {...register("somatotype", { required: true })}
                            />
                            <label
                                htmlFor={inputId}
                                className="flex w-full cursor-pointer flex-col items-center rounded-xl border-2 border-gray-100 p-2 transition-all hover:border-gray-300 peer-checked:border-[var(--color-primary)]/70 peer-checked:bg-[var(--color-primary)]/10"
                            >
                                <Image
                                    src={`/images/somatotipo/${file}`}
                                    alt={option.value}
                                    width={347}
                                    height={520}
                                    className="h-auto w-full object-contain"
                                />
                            </label>
                        </div>
                    );
                })}
            </div>
            <div className="mt-4 rounded-lg border border-gray-100 bg-zinc-50 p-3 text-xs sm:text-sm text-zinc-600">
                Elige la opción que más se parezca a tu contextura actual. Si ninguna imagen te representa, revisa la descripción de cada imagen para orientarte mejor.
            </div>
        </div>
    );
}