'use client'

import { usePathname } from "next/navigation";
import { Footer } from "./footer.component";
import { usesSesionLayout } from "@/shared/auth/sesion-routes";

// Footer del layout raíz. En las rutas bajo `(sesion)` no se muestra: SesionShell renderiza el
// suyo con el padding del sidebar fijo (que tapa el borde izquierdo de la página), igual que
// NavbarLandingGate cede la navbar a TopbarSesion.
export function FooterGate() {
  const pathname = usePathname();

  if (usesSesionLayout(pathname)) return null;

  return <Footer />;
}
