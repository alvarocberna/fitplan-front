//features
import { Hero, FitplanDescription, ConsultationDescription, PersonalPlanDescription, StandardPlanDescription } from "@/features";
//shared
import { getSession, getStartConsultationHref } from "@/shared/auth/session";


export default async function Home() {
  const { isAuthenticated, status, userInfo } = await getSession();
  const startHref = await getStartConsultationHref();

  return (
    <div>
      <Hero startHref={startHref} />
      <FitplanDescription/>
      <ConsultationDescription/>
      <PersonalPlanDescription/>
      {/* <StandardPlanDescription/> */}
    </div>
  );
}
