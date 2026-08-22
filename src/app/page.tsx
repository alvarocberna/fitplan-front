'use client'
//features
import { Hero, NuviDescription, ConsultationDescription, PersonalPlanDescription, StandardPlanDescription } from "@/features";


export default function Home() {
  return (
    <div>
      <Hero />
      <NuviDescription/>
      <ConsultationDescription/>
      <PersonalPlanDescription/>
      <StandardPlanDescription/>
    </div>
  );
}
