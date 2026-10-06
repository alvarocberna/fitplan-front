// Textos en español de los valores que devuelve el backend para las mediciones.

export const LEVEL_LABELS: Record<string, string> = {
    BASIC: 'Básica',
    ISAK_1: 'ISAK 1',
    BIOIMPEDANCE: 'Bioimpedancia',
}

export function levelLabel(level: string | null): string {
    return level ? (LEVEL_LABELS[level] ?? level) : 'Sin tipo'
}

// "Consulta N°X" si se tomó en una consulta, "Registro propio" si la registró el usuario.
export function originLabel(origin: string, consultationNumber: number | null): string {
    if (origin === 'CONSULTATION') {
        return consultationNumber != null ? `Consulta N°${consultationNumber}` : 'Consulta'
    }
    return 'Registro propio'
}

// Campo de una sección cruda -> { etiqueta, unidad }, en el orden en que se muestran.
export const RAW_FIELDS: Record<'basic' | 'skinfolds' | 'circumferences' | 'diameters', Record<string, { label: string; unit: string }>> = {
    basic: {
        weight: { label: 'Peso', unit: 'kg' },
        height: { label: 'Talla', unit: 'cm' },
        sittingHeight: { label: 'Talla sentado', unit: 'cm' },
        armSpan: { label: 'Envergadura', unit: 'cm' },
    },
    skinfolds: {
        triceps: { label: 'Tríceps', unit: 'mm' },
        subscapular: { label: 'Subescapular', unit: 'mm' },
        biceps: { label: 'Bíceps', unit: 'mm' },
        iliacCrest: { label: 'Cresta ilíaca', unit: 'mm' },
        supraspinal: { label: 'Supraespinal', unit: 'mm' },
        abdominal: { label: 'Abdominal', unit: 'mm' },
        thigh: { label: 'Muslo', unit: 'mm' },
        calf: { label: 'Pantorrilla', unit: 'mm' },
    },
    circumferences: {
        relaxedArm: { label: 'Brazo relajado', unit: 'cm' },
        flexedArm: { label: 'Brazo flexionado', unit: 'cm' },
        waist: { label: 'Cintura', unit: 'cm' },
        hip: { label: 'Cadera', unit: 'cm' },
        midThigh: { label: 'Muslo medio', unit: 'cm' },
        calf: { label: 'Pantorrilla', unit: 'cm' },
    },
    diameters: {
        humerus: { label: 'Húmero', unit: 'cm' },
        bistyloid: { label: 'Biestiloideo', unit: 'cm' },
        femur: { label: 'Fémur', unit: 'cm' },
    },
}

export const RAW_SECTION_TITLES: Record<keyof typeof RAW_FIELDS, string> = {
    basic: 'Datos básicos',
    skinfolds: 'Pliegues cutáneos',
    circumferences: 'Perímetros',
    diameters: 'Diámetros',
}

export const INDICATOR_LABELS: Record<string, string> = {
    BMI: 'IMC',
    BODY_FAT_PERCENTAGE: 'Grasa corporal',
    BODY_FAT_KG: 'Grasa corporal',
    VISCERAL_FAT_PERCENTAGE: 'Grasa visceral',
    VISCERAL_FAT_KG: 'Grasa visceral',
    MUSCLE_MASS_PERCENTAGE: 'Masa muscular',
    MUSCLE_MASS_KG: 'Masa muscular',
    BONE_MASS_PERCENTAGE: 'Masa ósea',
    BONE_MASS_KG: 'Masa ósea',
    LBMI: 'Índice de masa magra',
    ENDOMORPHY: 'Endomorfia',
    MESOMORPHY: 'Mesomorfia',
    ECTOMORPHY: 'Ectomorfia',
}

export const METHOD_LABELS: Record<string, string> = {
    BIOIMPEDANCE: 'Bioimpedancia',
}
