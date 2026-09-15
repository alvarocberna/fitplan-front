// Espejo de PanelSummaryDto en el backend
// (nutricionista-virtual-back/src/presentation/panel/dto/panel-summary.dto.ts).

export interface PanelNutritionalPlanDto {
    calorieIntake: number;
    proteinIntake: number;
    carbohydrateIntake: number;
    lipidIntake: number;
}

export interface PanelSummaryDto {
    firstName: string | null;
    paternalLastName: string | null;
    age: number | null;
    goal: string | null;
    nutritionalPlan: PanelNutritionalPlanDto | null;
}
