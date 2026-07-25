import { PlanNutricionalDto } from './plan-nutricional.dto'

// Dato de ejemplo que cumple PlanNutricionalDto, con todas las secciones
// completas (varios tiempos de comida, suplementos y recomendaciones deportivas).
// Sirve para previsualizar el PDF sin depender del formulario ni del chat.
export const planNutricionalMock: PlanNutricionalDto = {
    informacion_personal: {
        nombre: 'Juana',
        apellido: 'Pérez',
        edad: '28',
        fecha: '13/07/2026',
    },
    prescripcion: {
        regimen: 'Normocalórico',
        objetivo: 'Mantención de peso y composición corporal',
        calorias: 1800,
        proteina: 110,
        carbohidrato: 190,
        lipido: 55,
    },
    tiempos_de_comida: [
        {
            description: { tiempo: 'desayuno', hora: '08:00' },
            aporte: { calorias: 420, proteina: 25, carbohidrato: 45, lipido: 14 },
            alimentos: {
                cereales: '2 porciones',
                verduras_libre_consumo: null,
                verduras_consumo_general: null,
                frutas: '1 porción',
                proteinas_alta_en_grasa: null,
                proteinas_baja_en_grasa: '1 porción',
                lacteos_alto_en_grasa: null,
                lacteos_medio_en_grasa: '1 porción',
                lacteos_bajo_en_grasa: null,
                ricos_en_lipidos: '1 porción',
                aceites: null,
                azucares: null,
            },
            ejemplos: [
                '2 tostadas integrales + 2 claras de huevo + 1/2 palta',
                'Yogur natural + granola casera + fruta picada',
                'Avena cocida con leche descremada + plátano',
            ],
            comentarios: ['Evitar azúcar agregada.', 'Preferir pan integral por sobre pan blanco.'],
        },
        {
            description: { tiempo: 'almuerzo', hora: '13:30' },
            aporte: { calorias: 620, proteina: 40, carbohidrato: 65, lipido: 18 },
            alimentos: {
                cereales: '3 porciones',
                verduras_libre_consumo: '1 porción',
                verduras_consumo_general: '1 porción',
                frutas: null,
                proteinas_alta_en_grasa: null,
                proteinas_baja_en_grasa: '2 porciones',
                lacteos_alto_en_grasa: null,
                lacteos_medio_en_grasa: null,
                lacteos_bajo_en_grasa: null,
                ricos_en_lipidos: null,
                aceites: '1 cucharadita',
                azucares: null,
            },
            ejemplos: [
                'Pechuga de pollo a la plancha + arroz integral + ensalada verde',
                'Salmón al horno + puré de camote + brócoli al vapor',
                'Lentejas guisadas + arroz + ensalada de tomate',
            ],
            comentarios: ['Priorizar cocciones al horno, plancha o vapor por sobre fritos.'],
        },
        {
            description: { tiempo: 'once', hora: '17:00' },
            aporte: { calorias: 260, proteina: 15, carbohidrato: 30, lipido: 8 },
            alimentos: {
                cereales: '1 porción',
                verduras_libre_consumo: null,
                verduras_consumo_general: null,
                frutas: '1 porción',
                proteinas_alta_en_grasa: null,
                proteinas_baja_en_grasa: null,
                lacteos_alto_en_grasa: null,
                lacteos_medio_en_grasa: '1 porción',
                lacteos_bajo_en_grasa: null,
                ricos_en_lipidos: null,
                aceites: null,
                azucares: null,
            },
            ejemplos: [
                'Yogur natural + fruta picada',
                'Sándwich integral de queso fresco',
                'Batido de leche con fruta',
            ],
            comentarios: [],
        },
        {
            description: { tiempo: 'cena', hora: '20:30' },
            aporte: { calorias: 500, proteina: 30, carbohidrato: 50, lipido: 15 },
            alimentos: {
                cereales: '2 porciones',
                verduras_libre_consumo: '1 porción',
                verduras_consumo_general: null,
                frutas: null,
                proteinas_alta_en_grasa: null,
                proteinas_baja_en_grasa: '2 porciones',
                lacteos_alto_en_grasa: null,
                lacteos_medio_en_grasa: null,
                lacteos_bajo_en_grasa: null,
                ricos_en_lipidos: '1 porción',
                aceites: null,
                azucares: null,
            },
            ejemplos: [
                'Omelette de verduras + tostada integral',
                'Pescado al vapor + quínoa + ensalada',
                'Wrap integral de pollo y vegetales',
            ],
            comentarios: ['Evitar comidas muy pesadas antes de dormir.'],
        },
    ],
    suplementos: [
        {
            supplement: 'Creatina monohidratada',
            requirement: 5,
            dosageIndication: '5g al día',
            intakeIndication: 'Junto a alguna comida contundente',
            effects: [
                'Mejora el rendimiento en esfuerzos de alta intensidad',
                'Favorece la recuperación muscular',
            ],
            considerations: [
                'Mantener una buena hidratación durante el día',
                'No requiere fase de carga',
            ],
        },
        {
            supplement: 'Omega 3',
            requirement: 1,
            dosageIndication: '1 cápsula al día',
            intakeIndication: 'Junto a una comida con lípidos',
            effects: [
                'Efecto antiinflamatorio',
                'Apoyo a la salud cardiovascular',
            ],
            considerations: [
                'Preferir marcas certificadas por pureza y concentración de EPA/DHA',
            ],
        },
    ],
    recomendaciones_deportivas: [
        {
            sesion: 'Sesión de gimnasio (fuerza)',
            estrategia: 'Aportar energía suficiente para optimizar el rendimiento en la sesión.',
            pre_actividad: 'Colación con carbohidratos 60-90 min antes de entrenar.',
            durante_actividad: 'Hidratación con agua, sin necesidad de bebida deportiva.',
            post_actividad: 'Consumir proteína y carbohidrato dentro de los primeros 60 min post entrenamiento.',
        },
    ],
}
