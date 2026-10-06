//features - plans
import {
    getPredefinedProductAction,
    createPredefinedOrderAction,
    getPlanPreviewsAction,
    getPersonalizedProductAction,
} from './plans.actions'
//shared
import { unwrap, SessionRequiredError } from '@/shared/api/unwrap'
import { PredefinedProductDto } from '../dtos/predefined-product.dto'
import { PlanPreviewDto } from '../dtos/plan-preview.dto'
import { PersonalizedProductDto } from '../dtos/personalized-product.dto'


//SessionRequiredError se lanza cuando la acción falló por no haber sesión válida: la UI abre el modal
//de registro/login. Vive en shared (lo lanza el unwrap común); se re-exporta acá por compatibilidad.
export { SessionRequiredError }

export class PlansService {

    //ficha (nombre, precio, miniatura) de la versión de plan que corresponde a un código; falla si no existe o no está disponible
    public static async getPredefinedProduct(code: string): Promise<PredefinedProductDto> {
        return unwrap(await getPredefinedProductAction(code))
    }

    //ficha (nombre, precio) del plan personalizado; falla si el backend no lo tiene disponible
    public static async getPersonalizedProduct(): Promise<PersonalizedProductDto> {
        return unwrap(await getPersonalizedProductAction())
    }

    //crea la orden pendiente del plan predefinido elegido; lanza SessionRequiredError si no hay sesión
    public static async createPredefinedOrder(code: string): Promise<{ orderId: string }> {
        return unwrap(await createPredefinedOrderAction(code))
    }

    //las (hasta) 4 fichas de vista previa (una por familia) para el carrusel del home
    public static async getPlanPreviews(): Promise<PlanPreviewDto[]> {
        return unwrap(await getPlanPreviewsAction())
    }

}
