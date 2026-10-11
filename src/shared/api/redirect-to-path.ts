import { NextResponse } from 'next/server'

// Redirección a una ruta de este mismo sitio desde un route handler, con `Location` relativo.
// No se usa NextResponse.redirect(new URL(path, request.url)): detrás del hosting (Amplify) el
// `request.url` que ve el handler es interno (https://localhost:3000/...), y el navegador terminaba en
// localhost. Un `Location` relativo lo resuelve el navegador contra la URL que él mismo pidió.
// `path` debe ser una ruta interna fija o ya validada (empieza con "/"), nunca un valor del usuario.
export function redirectToPath(path: string, status: 303 | 307 = 307): NextResponse {
  return new NextResponse(null, { status, headers: { Location: path } })
}
