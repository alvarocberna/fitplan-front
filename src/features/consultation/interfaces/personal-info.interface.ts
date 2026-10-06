
export interface FormPersonalInfoInterface {
  rut?: number | null
  dvRut?: string | null
  firstName: string
  middleName?: string | null
  paternalLastName: string
  maternalLastName?: string | null
  gender: string
  athlete: boolean
  email: string
  // phone: number | null
  dateOfBirth: Date
}
