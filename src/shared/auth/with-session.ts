import 'server-only'
import { redirect } from 'next/navigation'
import { isSessionRequiredError } from '../api/unwrap'

// Para la carga de datos de un Server Component del área de sesión. El proxy deja pasar mientras la
// cookie de sesión sea válida (7 días), pero el access_token puede no poder refrescarse (refresh
// revocado o vencido): el backend responde 401 y los servicios lanzan SessionRequiredError. En vez de
// caer al error.tsx ("Algo salió mal"), se lleva al usuario a iniciar sesión de nuevo.
// Cualquier otro error sigue su camino normal hacia el boundary.
export async function withSession<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load()
  } catch (error) {
    if (isSessionRequiredError(error)) redirect('/login?error=session_expired')
    throw error
  }
}
