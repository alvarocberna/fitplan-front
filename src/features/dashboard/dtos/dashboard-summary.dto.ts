// Espejo de SummaryDto en el backend (GET /me/summary)
// (fitplan-back/src/modules/identity/dto/summary.dto.ts).

export interface DashboardNutritionalPlanDto {
    dietRegimen: string | null;
    calorieIntake: number;
    proteinIntake: number;
    carbohydrateIntake: number;
    lipidIntake: number;
}

// Última medición del historial (consulta o registrada por el usuario). bmi, bmiClassification y
// bfPercentage vienen de measurement_results y pueden ser null si no se calcularon.
export interface DashboardLastMeasurementDto {
    measuredAt: string;
    weight: number | null;
    height: number | null;
    bmi: number | null;
    bmiClassification: string | null;
    bfPercentage: number | null;
}

export interface DashboardSummaryDto {
    firstName: string | null;
    middleName: string | null;
    paternalLastName: string | null;
    maternalLastName: string | null;
    age: number | null;
    // Fecha (ISO) de la última consulta con plan generado.
    lastConsultationDate: string | null;
    goal: string | null;
    nutritionalPlan: DashboardNutritionalPlanDto | null;
    lastMeasurement: DashboardLastMeasurementDto | null;
}
