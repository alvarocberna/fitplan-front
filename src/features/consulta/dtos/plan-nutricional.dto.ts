
export interface PlanNutricionalDto {
    informacion_personal: {
        nombre: string 
        apellido: string
        edad: string 
        fecha: string
    }
    prescripcion: {
        regimen: string
        objetivo: string 
        calorias: number 
        proteina: number 
        carbohidrato: number 
        lipido: number
    }
    tiempos_de_comida: {
        description: {
            tiempo: string // desayuno | almuerzo | once | cena | colacion
            hora: string | null //ej 10am
        },
        aporte: {
            calorias: number 
            proteina: number 
            carbohidrato: number 
            lipido: number
        },
        alimentos: {
            cereales: string | null 
            verduras_libre_consumo: string | null
            verduras_consumo_general: string | null 
            frutas: string | null
            proteinas_alta_en_grasa: string | null 
            proteinas_baja_en_grasa: string | null
            lacteos_alto_en_grasa: string | null
            lacteos_medio_en_grasa: string | null
            lacteos_bajo_en_grasa: string | null 
            ricos_en_lipidos: string | null
            aceites: string | null
            azucares: string | null
        }
        ejemplos: string[] // 3 ejemplos
        comentarios: string[] 
    }[]
    suplementos: {
        suplemento: string | null   //ej creatina
        recomendacion: string | null //ej: tomar 1v al día junto a alguna comida contundente, preferir creatina monohidratada
    }[]
    recomendaciones_deportivas: {
        sesion: string | null //sesion de gimnasio
        estrategia: string | null //aportar energía para optimizar las sesiones de entrenamiento
        pre_actividad: string | null
        durante_actividad: string | null
        post_actividad: string | null
    }[]
}