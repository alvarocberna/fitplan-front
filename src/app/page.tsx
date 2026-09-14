//features
import { Hero, NuviDescription, ConsultationDescription, PersonalPlanDescription, StandardPlanDescription } from "@/features";
//shared
import { getSession, getStartConsultationHref } from "@/shared/auth/session";


export default async function Home() {
  const { isAuthenticated, status, userInfo } = await getSession();
  const startHref = await getStartConsultationHref();

  return (
    <div>
        <Hero startHref={startHref} />
      <div className="w-full text-center py-2 text-sm">
        {isAuthenticated ? (
          <span>
            Hola, {String(userInfo?.email ?? '')} · <a href="/api/cognito/logout">Cerrar sesión</a>
          </span>
        ) : status === 'expired' ? (
          <span>
            Tu sesión expiró · <a href="/api/cognito/login">Inicia sesión de nuevo</a>
          </span>
        ) : (
          <a href="/api/cognito/login">Iniciar sesión</a>
        )}
      </div>
      <NuviDescription/>
      <ConsultationDescription/>
      <PersonalPlanDescription/>
      <StandardPlanDescription/>
    </div>
  );
}
