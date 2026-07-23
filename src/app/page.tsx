'use client'
//FEATURES
import { Portada, SaberMas, NuviDescripcion, ConsultaDescripcion, PlanPersonalDescripcion, PlanEstandarDescripcion } from "@/features";
//CSS
// import './globals.css'

export default function Home() {
  return (
    <div>
      <Portada />
      {/* <SaberMas/> */}
      <NuviDescripcion/>
      <ConsultaDescripcion/>
      <PlanPersonalDescripcion/>
      <PlanEstandarDescripcion/>
    </div>
  );
}
