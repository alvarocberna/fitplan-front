export const SESION_PATHS = new Set(["/inicio", "/planes", "/mediciones", "/perfil"]);

// Secciones "de flujo" dentro del layout de sesión (consulta → pago → orden): el sidebar arranca
// acoplado (solo el ícono para desacoplarlo) para dejar el espacio al contenido del flujo. Ver
// sesion-shell.component.tsx.
const FOCUS_PREFIXES = ["/consulta", "/pago", "/ordenes"];

// Prefijos del flujo que exigen sesión en su totalidad (la raíz y todas las subrutas). /consulta
// queda afuera a propósito: su raíz (/consulta, vacía y sin uso) es pública y se resuelve aparte
// en src/proxy.ts (PUBLIC_CONSULTA_PATHS).
const SESSION_GATED_PREFIXES = ["/pago", "/ordenes"];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

// Área de usuario (/inicio, /planes, /mediciones, /perfil y sus subrutas, p. ej. /inicio/consultas/[id]): el proxy exige
// sesión (/consulta/*, /pago/* y /ordenes/* se resuelven aparte, ver src/proxy.ts).
export function isSesionRoute(pathname: string): boolean {
  return [...SESION_PATHS].some((path) => matchesPrefix(pathname, path));
}

// /pago/* y /ordenes/*: rutas del flujo que el proxy protege por prefijo.
export function isSessionGatedPrefix(pathname: string): boolean {
  return SESSION_GATED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

// Rutas de flujo (/consulta/*, /pago/*, /ordenes/*) donde el sidebar de sesión arranca acoplado.
export function isFocusRoute(pathname: string): boolean {
  return FOCUS_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

// Toda ruta que vive bajo el layout `(sesion)` y por lo tanto muestra NavbarSesion en vez de
// NavbarLanding.
export function usesSesionLayout(pathname: string): boolean {
  return isSesionRoute(pathname) || isFocusRoute(pathname);
}
