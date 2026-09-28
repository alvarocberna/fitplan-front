// Espejo de los DTOs de /me/measurements del backend
// (nutricionista-virtual-back/src/modules/clinical/dto/measurement.dto.ts).

export type MeasurementLevel = 'BASIC' | 'ISAK_1' | 'BIOIMPEDANCE';
export type RecordableLevel = 'BASIC' | 'BIOIMPEDANCE';
export type MeasurementOrigin = 'CONSULTATION' | 'SELF_REPORTED';
export type MeasurementValueUnit = 'PERCENTAGE' | 'KG';

// Componente de una bioimpedancia (grasa corporal, masa muscular, grasa visceral o masa ósea), en % o
// en kg, nunca ambos: el backend calcula el otro.
export interface MeasurementValueDto {
    value: number;
    unit: MeasurementValueUnit;
}

// Body de POST /me/measurements. En una bioimpedancia bodyFat y muscleMass son obligatorios;
// visceralFat y boneMass, opcionales.
export interface RecordMeasurementDto {
    level: RecordableLevel;
    measuredAt?: string; // ISO; por defecto, ahora
    weight: number;
    height: number;
    bodyFat?: MeasurementValueDto;
    muscleMass?: MeasurementValueDto;
    visceralFat?: MeasurementValueDto;
    boneMass?: MeasurementValueDto;
}

// Body de PATCH /me/measurements/:id: solo lo que cambia (sin `level`). null en visceralFat/boneMass
// quita el componente guardado.
export type UpdateMeasurementDto = Partial<
    Omit<RecordMeasurementDto, 'level' | 'visceralFat' | 'boneMass'>
> & {
    visceralFat?: MeasurementValueDto | null;
    boneMass?: MeasurementValueDto | null;
};

// Ítem de GET /me/measurements. bmi/bfPercentage/mmPercentage son los resultados guardados (null si
// no se ingresaron o calcularon).
export interface MeasurementSummaryDto {
    measurementId: string;
    measurementNumber: number;
    measuredAt: string; // ISO
    level: MeasurementLevel | null;
    origin: MeasurementOrigin;
    consultationId: string | null;
    consultationNumber: number | null;
    weight: number | null;
    height: number | null;
    bmi: number | null;
    bmiClassification: string | null;
    bfPercentage: number | null;
    mmPercentage: number | null;
}

// Una sección de valores crudos (datos básicos, pliegues, ...): solo los campos con valor.
export type MeasurementRawSection = Record<string, number>;

export interface MeasurementResultDto {
    indicator: string;
    value: number;
    unit: string | null;
    classification: string | null;
    method: string | null;
}

// Respuesta de GET/POST/PATCH /me/measurements[/:id].
export interface MeasurementDetailDto {
    measurementId: string;
    measurementNumber: number;
    measuredAt: string; // ISO
    level: MeasurementLevel | null;
    origin: MeasurementOrigin;
    consultationId: string | null;
    consultationNumber: number | null;
    editable: boolean;
    raw: {
        basic: MeasurementRawSection | null;
        skinfolds: MeasurementRawSection | null;
        circumferences: MeasurementRawSection | null;
        diameters: MeasurementRawSection | null;
    };
    results: MeasurementResultDto[];
}
