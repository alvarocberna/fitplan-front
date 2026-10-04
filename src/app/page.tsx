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
      <NuviDescription/>
      <ConsultationDescription/>
      <PersonalPlanDescription/>
      {/* <StandardPlanDescription/> */}
    </div>
  );
}
