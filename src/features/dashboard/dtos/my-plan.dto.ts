// Espejo de los DTOs de "mis planes" del backend (GET /me/plans y GET /me/plans/:orderId)
// (nutricionista-virtual-back/src/modules/plans/dto/my-plan.dto.ts).

export type MyPlanType = 'GENERATED' | 'PREDEFINED';

// Objetivo, régimen e ingesta real del plan (nunca los requerimientos).
export interface MyPlanSummaryInfoDto {
    goal: string | null;
    dietRegimen: string | null;
    calorieIntake: number | null;
    proteinIntake: number | null;
    carbohydrateIntake: number | null;
    lipidIntake: number | null;
}

// Ítem de GET /me/plans: una orden pagada, lista y con PDF del usuario.
export interface MyPlanSummaryDto {
    orderId: string;
    type: MyPlanType;
    name: string;
    purchasedAt: string; // ISO
    // URL firmada (corta duración) de descarga del PDF (Content-Disposition: attachment).
    pdfUrl: string;
    // URL firmada de la miniatura (página 1); null si el plan no tiene miniatura.
    thumbnailUrl: string | null;
    // null si no hay datos (plan sin NutritionalPlan o producto estándar sin resumen cargado).
    summary: MyPlanSummaryInfoDto | null;
}

export interface MacrosDto {
    calories: number;
    protein: number;
    carbohydrate: number;
    fat: number;
}

export type MealTimeSlot = 'BREAKFAST' | 'LUNCH' | 'AFTERNOON_TEA' | 'DINNER' | 'SNACK';

export type MealTimePortionGroup =
    | 'cereal'
    | 'freeConsumptionVegetable'
    | 'generalConsumptionVegetable'
    | 'fruit'
    | 'highFatProtein'
    | 'lowFatProtein'
    | 'highFatDairy'
    | 'mediumFatDairy'
    | 'lowFatDairy'
    | 'highProteinDairy'
    | 'lipidRich'
    | 'oil'
    | 'sugar';

export interface MyPlanMealTimeDto {
    time: MealTimeSlot;
    hour: string | null;
    intake: MacrosDto;
    // Solo los grupos presentes en el tiempo de comida.
    portions: Partial<Record<MealTimePortionGroup, number>>;
    examples: string[];
    comments: string[];
    // "<grupo>: <alimentos equivalentes>"
    equivalences: string[];
}

export interface MyPlanSupplementDto {
    supplement: string;
    requirement: number;
    doseInstructions: string | null;
    intakeInstructions: string | null;
    intake: MacrosDto;
    effects: string[];
    considerations: string[];
}

export interface MyPlanSportsRecommendationDto {
    session: string | null;
    strategy: string | null;
    preActivity: string | null;
    duringActivity: string | null;
    postActivity: string | null;
}

export interface MyGeneratedPlanDetailDto {
    consultationId: string | null;
    planName: string;
    period: 'EVENTO' | 'MICROCICLO' | 'MESOCICLO' | 'MACROCICLO' | null;
    startDate: string | null; // ISO
    endDate: string | null; // ISO
    goal: string;
    dietRegimen: string;
    requirements: MacrosDto;
    intake: MacrosDto;
    mealTimes: MyPlanMealTimeDto[];
    supplements: MyPlanSupplementDto[];
    sportsRecommendations: MyPlanSportsRecommendationDto[];
}

export interface MyPredefinedPlanDetailDto {
    description: string;
    summary: MyPlanSummaryInfoDto | null;
}

// Valores que el plan proyecta alcanzar al final de su período. bf*/mm* solo vienen si la proyección
// se hizo sobre una bioimpedancia.
export interface MyPlanProjectionValuesDto {
    projectedStartDate: string; // YYYY-MM-DD
    projectedEndDate: string; // YYYY-MM-DD
    weight: number;
    bmi: number | null;
    bfKg: number | null;
    bfPercentage: number | null;
    mmKg: number | null;
    mmPercentage: number | null;
}

// Respuesta de GET /me/plans/latest/projection (CU-PLN-07): período del último plan con fecha de
// término y su proyección (null si no tiene). El backend responde 404 si no hay plan con período.
export interface MyLatestPlanProjectionDto {
    orderId: string;
    planName: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    projection: MyPlanProjectionValuesDto | null;
}

// Respuesta de GET /me/plans/:orderId: `generated` o `predefined` según `type` (el otro en null).
export interface MyPlanDetailDto extends Omit<MyPlanSummaryDto, 'summary'> {
    generated: MyGeneratedPlanDetailDto | null;
    predefined: MyPredefinedPlanDetailDto | null;
}
