//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features - panel
import { PanelSummaryDto } from '../dtos/panel-summary.dto'

interface PanelSummaryProps {
    summary: PanelSummaryDto
}

const INTAKE_FIELDS: { key: keyof NonNullable<PanelSummaryDto['nutritionalPlan']>; label: string; unit: string }[] = [
    { key: 'calorieIntake', label: 'Calorías', unit: 'kcal' },
    { key: 'proteinIntake', label: 'Proteínas', unit: 'g' },
    { key: 'carbohydrateIntake', label: 'Carbohidratos', unit: 'g' },
    { key: 'lipidIntake', label: 'Lípidos', unit: 'g' },
]

export function PanelSummary({ summary }: PanelSummaryProps) {
    return (
        <div className="w-full flex flex-col gap-6">
            <Card widthInner="80%">
                <SubsectionHead>
                    <SubsectionTitle title="Mi información" />
                </SubsectionHead>
                <SubsectionBody>
                    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-zinc-500">Nombre</p>
                            <p className="text-zinc-900 font-medium">
                                {[summary.firstName, summary.paternalLastName].filter(Boolean).join(' ') || 'Sin datos'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500">Edad</p>
                            <p className="text-zinc-900 font-medium">{summary.age ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500">Objetivo</p>
                            <p className="text-zinc-900 font-medium">{summary.goal ?? 'Aún no definido'}</p>
                        </div>
                    </div>
                </SubsectionBody>
            </Card>

            <Card widthInner="80%">
                <SubsectionHead>
                    <SubsectionTitle title="Último plan nutricional" />
                </SubsectionHead>
                <SubsectionBody>
                    {summary.nutritionalPlan ? (
                        <>
                            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                {INTAKE_FIELDS.map(({ key, label, unit }) => (
                                    <div key={key}>
                                        <p className="text-sm text-zinc-500">{label}</p>
                                        <p className="text-zinc-900 font-medium">
                                            {summary.nutritionalPlan![key]} {unit}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {/* Próximamente: vista previa del PDF del plan (pendiente el bucket S3 donde se almacenarán) */}
                            <p className="text-sm text-zinc-400 mt-6 text-center">
                                La vista previa del PDF del plan estará disponible próximamente.
                            </p>
                        </>
                    ) : (
                        <p className="text-zinc-500 text-center">
                            Todavía no tienes un plan nutricional generado.
                        </p>
                    )}
                </SubsectionBody>
            </Card>
        </div>
    )
}
