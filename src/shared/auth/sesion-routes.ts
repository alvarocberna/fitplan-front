export const SESION_PATHS = new Set(["/panel", "/perfil"]);

// Secciones "de flujo" dentro del layout de sesión: el sidebar arranca acoplado (solo el ícono
// para desacoplarlo) para dejar el espacio al contenido del flujo. Ver sesion-shell.component.tsx.
const FOCUS_PREFIXES = ["/consulta", "/ordenes"];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

// Rutas que el proxy protege exigiendo sesión por igualdad exacta (/consulta/* y /ordenes/* se
// resuelven aparte, ver src/proxy.ts).
export function isSesionRoute(pathname: string): boolean {
  return SESION_PATHS.has(pathname);
}

// Rutas de flujo (/consulta/*, /ordenes/*) donde el sidebar de sesión arranca acoplado.
export function isFocusRoute(pathname: string): boolean {
  return FOCUS_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

// Toda ruta que vive bajo el layout `(sesion)` y por lo tanto muestra NavbarSesion en vez de
// NavbarLanding.
export function usesSesionLayout(pathname: string): boolean {
  return isSesionRoute(pathname) || isFocusRoute(pathname);
}
