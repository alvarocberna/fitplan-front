import { PlanNutricionalDto, SupplementPrescription } from '../dtos/plan-nutricional.dto'

type TiempoDeComida = PlanNutricionalDto['tiempos_de_comida'][number]
type AlimentosTiempo = TiempoDeComida['alimentos']

// Claves de AlimentosTiempo que representan grupos de alimentos.
// El orden de este arreglo define el orden en el que se listan los alimentos en el PDF.
// Para agregar o quitar una categoría de alimento del PDF, solo edita este arreglo.
export const CAMPOS_ALIMENTOS: { clave: keyof AlimentosTiempo; label: string }[] = [
    { clave: 'cereales', label: 'Cereales' },
    { clave: 'verduras_libre_consumo', label: 'Verdura de libre consumo' },
    { clave: 'verduras_consumo_general', label: 'Verdura de consumo general' },
    { clave: 'frutas', label: 'Fruta' },
    { clave: 'proteinas_alta_en_grasa', label: 'Proteína alta en grasa' },
    { clave: 'proteinas_baja_en_grasa', label: 'Proteína baja en grasa' },
    { clave: 'lacteos_alto_en_grasa', label: 'Lácteo alto en grasa' },
    { clave: 'lacteos_medio_en_grasa', label: 'Lácteo medio en grasa' },
    { clave: 'lacteos_bajo_en_grasa', label: 'Lácteo bajo en grasa' },
    { clave: 'lacteos_alto_en_proteina', label: 'Lácteo alto en proteína' },
    { clave: 'ricos_en_lipidos', label: 'Rico en lípidos' },
    { clave: 'aceites', label: 'Aceite' },
    { clave: 'azucares', label: 'Azúcar' },
]

// Devuelve solo los grupos de alimentos que vienen con datos (no null) para un tiempo de comida dado.
export function obtenerAlimentos(tiempo: TiempoDeComida): { label: string; porcion: string; equivalencia: string }[] {
    return CAMPOS_ALIMENTOS
        .filter(({ clave }) => !!tiempo.alimentos[clave])
        .map(({ clave, label }) => {
            const alimento = tiempo.alimentos[clave]!
            return { label, porcion: alimento.porcion, equivalencia: alimento.equivalencia }
        })
}

// Suma el aporte nutricional de todos los suplementos (para la fila resumen de la página 2).
export function sumarAporteSuplementos(suplementos: SupplementPrescription[]): { calorias: number; proteina: number; carbohidrato: number; lipido: number } {
    return suplementos.reduce(
        (total, s) => ({
            calorias: total.calorias + s.aporte.calorias,
            proteina: total.proteina + s.aporte.proteina,
            carbohidrato: total.carbohidrato + s.aporte.carbohidrato,
            lipido: total.lipido + s.aporte.lipido,
        }),
        { calorias: 0, proteina: 0, carbohidrato: 0, lipido: 0 }
    )
}

// "desayuno" -> "Desayuno"
export function capitalizar(texto: string): string {
    if (!texto) return texto
    return texto.charAt(0).toUpperCase() + texto.slice(1)
}
