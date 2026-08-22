
export interface FormPersonalInfoInterface {
  rut: number
  dvRut: string
  firstName: string
  middleName: string | null
  paternalLastName: string
  maternalLastName: string | null
  gender: string
  athlete: boolean
  email: string
  // phone: number | null
  dateOfBirth: Date
}
