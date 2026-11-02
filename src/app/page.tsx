//features
import { Hero, FitplanDescription, ConsultationDescription, PersonalPlanDescription } from "@/features";
//shared
import { getStartConsultationHref } from "@/shared/auth/session";


export default async function Home() {
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
