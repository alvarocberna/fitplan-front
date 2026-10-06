export interface SupplementPrescription {
    supplement: string,
    requirement: number,
    dosageIndication: string,
    intakeIndication: string,
    effects: string[],
    considerations: string[],
    intake: {
        calories: number,
        protein: number,
        carbohydrate: number,
        fat: number,
    },
}

export interface FoodWithEquivalence {
    portion: string
    equivalence: string
}

export interface NutritionPlanDto {
    personalInfo: {
        name: string
        lastName: string
        age: string
        date: string
    }
    prescription: {
        regimen: string
        goal: string
        calories: number
        protein: number
        carbohydrate: number
        fat: number
    }
    // Aporte nutricional total del plan: suma de todos los mealTimes + suplemento de whey
    // protein (si aplica). NO incluye sportsRecommendations ni otros suplementos (creatina,
    // cafeina, nitrato, bicarbonato).
    planIntake: {
        // Porcentaje de adecuación de "totalIntake" en relación a los requerimientos de "prescription".
        adequacy: {
            calories: number
            protein: number
            carbohydrate: number
            fat: number
        }
        // Mismos valores que "adequacy", en términos absolutos.
        totalIntake: {
            calories: number
            protein: number
            carbohydrate: number
            fat: number
        }
    }
    mealTimes: {
        description: {
            time: string // desayuno | almuerzo | once | cena | colacion
            hour: string | null //ej 10am
        },
        intake: {
            calories: number
            protein: number
            carbohydrate: number
            fat: number
        },
        foods: {
            cereals: FoodWithEquivalence | null
            freeConsumptionVegetables: FoodWithEquivalence | null
            generalConsumptionVegetables: FoodWithEquivalence | null
            fruits: FoodWithEquivalence | null
            highFatProteins: FoodWithEquivalence | null
            lowFatProteins: FoodWithEquivalence | null
            highFatDairy: FoodWithEquivalence | null
            mediumFatDairy: FoodWithEquivalence | null
            lowFatDairy: FoodWithEquivalence | null
            highProteinDairy: FoodWithEquivalence | null
            highLipidFoods: FoodWithEquivalence | null
            oils: FoodWithEquivalence | null
            sugars: FoodWithEquivalence | null
        }
        examples: string[] // 3 ejemplos
        comments: string[]
    }[]
    supplements: SupplementPrescription[]
    sportsRecommendations: {
        session: string | null //sesion de gimnasio
        strategy: string | null //aportar energía para optimizar las sesiones de entrenamiento
        preActivity: string | null
        duringActivity: string | null
        postActivity: string | null
    }[]
}