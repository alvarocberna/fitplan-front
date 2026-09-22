//shared
import { getSession } from '@/shared/auth/session'
//features - plans (import directo, no por el barrel: ver "Barrel gotcha" en CLAUDE.md; acá solo se usa
//getSession en el servidor y se le pasa el resultado como prop al componente cliente)
import { CartView } from '@/features/plans/components/cart-view.component'

// Server Component: la cookie de sesión es httpOnly, así que solo el servidor sabe si hay sesión. El
// resto del carro (el plan elegido) vive en el estado global del cliente, ver CartView.
export default async function Cart() {
  const { isAuthenticated } = await getSession()
  return <CartView isAuthenticated={isAuthenticated} />
}
