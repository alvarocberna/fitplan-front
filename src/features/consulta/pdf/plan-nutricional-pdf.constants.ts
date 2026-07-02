import { PlanNutricionalDto } from '../dtos/plan-nutricional.dto'

type TiempoDeComida = PlanNutricionalDto['tiempos_de_comida'][number]

// Claves de TiempoDeComida que representan grupos de alimentos (excluye tiempo/hora/macros/ejemplos/comentarios).
// El orden de este arreglo define el orden en el que se listan los alimentos en el PDF.
// Para agregar o quitar una categoría de alimento del PDF, solo edita este arreglo.
export const CAMPOS_ALIMENTOS: { clave: keyof TiempoDeComida; label: string }[] = [
    { clave: 'cereales', label: 'Cereales' },
    { clave: 'verdura_libre_consumo', label: 'Verdura de libre consumo' },
    { clave: 'verdura_consumo_general', label: 'Verdura de consumo general' },
    { clave: 'fruta', label: 'Fruta' },
    { clave: 'proteina_alta_en_grasa', label: 'Proteína alta en grasa' },
    { clave: 'proteina_baja_en_grasa', label: 'Proteína baja en grasa' },
    { clave: 'lacteo_alto_en_grasa', label: 'Lácteo alto en grasa' },
    { clave: 'lacteo_medio_en_grasa', label: 'Lácteo medio en grasa' },
    { clave: 'lacteo_bajo_en_grasa', label: 'Lácteo bajo en grasa' },
    { clave: 'rico_en_lipidos', label: 'Rico en lípidos' },
    { clave: 'aceite', label: 'Aceite' },
    { clave: 'azucar', label: 'Azúcar' },
]

// Devuelve solo los grupos de alimentos que vienen con datos (no null) para un tiempo de comida dado.
export function obtenerAlimentos(tiempo: TiempoDeComida): { label: string; valor: string }[] {
    return CAMPOS_ALIMENTOS
        .filter(({ clave }) => !!tiempo[clave])
        .map(({ clave, label }) => ({ label, valor: tiempo[clave] as string }))
}

// "desayuno" -> "Desayuno"
export function capitalizar(texto: string): string {
    if (!texto) return texto
    return texto.charAt(0).toUpperCase() + texto.slice(1)
}
