//features - plans
import { getPredefinedProductAction, createPredefinedOrderAction, type ActionResult } from './plans.actions'
import { PredefinedProductDto } from '../dtos/predefined-product.dto'

//se lanza cuando la acción falló por no haber sesión válida: la UI abre el modal de registro/login
export class SessionRequiredError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'SessionRequiredError'
    }
}

function unwrap<T>(result: ActionResult<T>): T {
    if (!result.ok) {
        if (result.code === 'unauthenticated') throw new SessionRequiredError(result.message)
        throw new Error(result.message)
    }
    return result.data
}

export class PlansService {

    //ficha (nombre, precio, miniatura) de la versión de plan que corresponde a un código; falla si no existe o no está disponible
    public static async getPredefinedProduct(code: string): Promise<PredefinedProductDto> {
        return unwrap(await getPredefinedProductAction(code))
    }

    //crea la orden pendiente del plan predefinido elegido; lanza SessionRequiredError si no hay sesión
    public static async createPredefinedOrder(code: string): Promise<{ orderId: string }> {
        return unwrap(await createPredefinedOrderAction(code))
    }

}
