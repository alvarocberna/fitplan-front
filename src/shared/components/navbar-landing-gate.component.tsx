'use client'

import { usePathname } from "next/navigation";
import { NavbarLanding } from "@/features/home/components/navbar-landing.component";
import { usesSesionLayout } from "@/shared/auth/sesion-routes";

export function NavbarLandingGate() {
  const pathname = usePathname();

  if (usesSesionLayout(pathname) || pathname.startsWith("/dev")) return null;

  return <NavbarLanding />;
}
