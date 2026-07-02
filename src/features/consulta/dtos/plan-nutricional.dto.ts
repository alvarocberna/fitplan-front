
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
        tiempo: string // desayuno | almuerzo | once | cena | colacion
        hora: string | null //ej 10am
        calorias: number 
        proteina: number 
        carbohidrato: number 
        lipido: number
        cereales: string | null 
        verdura_libre_consumo: string | null
        verdura_consumo_general: string | null 
        fruta: string | null
        proteina_alta_en_grasa: string | null 
        proteina_baja_en_grasa: string | null
        lacteo_alto_en_grasa: string | null
        lacteo_medio_en_grasa: string | null
        lacteo_bajo_en_grasa: string | null 
        rico_en_lipidos: string | null
        aceite: string | null
        azucar: string | null
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