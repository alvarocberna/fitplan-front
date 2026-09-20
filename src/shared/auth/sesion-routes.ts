export const SESION_PATHS = new Set(["/panel", "/perfil"]);

export function isSesionRoute(pathname: string): boolean {
  return SESION_PATHS.has(pathname);
}
