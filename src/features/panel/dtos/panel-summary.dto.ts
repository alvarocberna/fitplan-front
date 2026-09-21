// Espejo de PanelSummaryDto en el backend
// (nutricionista-virtual-back/src/presentation/panel/dto/panel-summary.dto.ts).

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
