
export interface FormInfoUserInterface {
  rut: number
  dv_rut: string
  nombre_primero: string
  nombre_segundo: string | null
  apellido_paterno: string
  apellido_materno: string | null
  genero: string
  deportista: boolean
  correo: string
  // celular: number | null
  fecha_nacimiento: Date
}
