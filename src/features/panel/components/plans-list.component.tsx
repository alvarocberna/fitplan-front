//shared
import { Card, PlanPreviewCard, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features
import { OrderSummaryDto } from '../../consultation/dtos/order.dto'

interface PlansListProps {
    orders: OrderSummaryDto[]
}

// Tarjeta 3 del panel: planes con PDF disponible (GET /me/plans, HU-PLN-04).
export function PlansList({ orders }: PlansListProps) {
    return (
        <Card widthInner="80%" variant="solid">
            <SubsectionHead>
                <SubsectionTitle title="Mis planes nutricionales" />
            </SubsectionHead>
            <SubsectionBody>
                {orders.length > 0 ? (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-8 justify-items-center">
                        {orders.map((order) => (
                            <PlanPreviewCard
                                key={order.orderId}
                                pdfUrl={order.pdfUrl}
                                thumbnailUrl={order.thumbnailUrl}
                                creationDate={order.creationDate}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-zinc-500 text-center">
                        Todavía no tienes ningún plan nutricional generado.
                    </p>
                )}
            </SubsectionBody>
        </Card>
    )
}
