'use client'
//features
import { Portada, NuviDescripcion, ConsultaDescripcion, PlanPersonalDescripcion, PlanEstandarDescripcion } from "@/features";


export default function Home() {
  return (
    <div>
      <Portada />
      <NuviDescripcion/>
      <ConsultaDescripcion/>
      <PlanPersonalDescripcion/>
      <PlanEstandarDescripcion/>
    </div>
  );
}
