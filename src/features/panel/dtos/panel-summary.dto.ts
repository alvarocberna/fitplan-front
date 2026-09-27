// Espejo de SummaryDto en el backend (GET /me/summary)
// (nutricionista-virtual-back/src/modules/identity/dto/summary.dto.ts).

export interface PanelNutritionalPlanDto {
    dietRegimen: string | null;
    calorieIntake: number;
    proteinIntake: number;
    carbohydrateIntake: number;
    lipidIntake: number;
}

export interface PanelSummaryDto {
    firstName: string | null;
    middleName: string | null;
    paternalLastName: string | null;
    maternalLastName: string | null;
    age: number | null;
    // Fecha (ISO) de la última consulta con plan generado.
    lastConsultationDate: string | null;
    goal: string | null;
    nutritionalPlan: PanelNutritionalPlanDto | null;
}
