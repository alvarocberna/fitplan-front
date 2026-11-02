// Contrato del backend real para el backend falso. Lee e2e/contract/openapi.json, generado desde el
// backend con `npm run openapi:export` (en fitplan-back), y lo usa para rechazar lo mismo que rechazaría
// la API real: rutas inexistentes, ids que no son UUID y bodies que no pasan su ValidationPipe.
//
// El contrato describe rutas y bodies de entrada. Las respuestas del backend son interfaces sin esquema
// en el OpenAPI, así que no se validan acá: los mocks se tipan con los DTOs del frontend
// (e2e/helpers/mock-backend.ts).
import { readFileSync } from 'node:fs'
import path from 'node:path'
import Ajv from 'ajv'

const API_PREFIX = '/api/v1'
// Relativo a la raíz del frontend (no import.meta: Playwright transpila este módulo al importarlo desde un spec).
const document = JSON.parse(readFileSync(path.resolve(process.cwd(), 'e2e/contract/openapi.json'), 'utf8'))

// Parámetros de ruta que el backend valida con ParseUUIDPipe({ version: '4' }). `code` no es uno de ellos.
const UUID_PARAMS = new Set(['id', 'orderId', 'consultationId', 'measurementId'])
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Traduce un esquema OpenAPI a JSON Schema con las reglas del ValidationPipe real:
// - forbidNonWhitelisted: una propiedad desconocida es un error (additionalProperties: false);
// - `nullable` de OpenAPI: se expresa como "null o el esquema".
function toJsonSchema(schema) {
  if (Array.isArray(schema)) return schema.map(toJsonSchema)
  if (schema === null || typeof schema !== 'object') return schema

  const { nullable, ...rest } = schema
  const converted = Object.fromEntries(
    Object.entries(rest).map(([key, value]) => {
      if (key === 'properties') {
        return [key, Object.fromEntries(Object.entries(value).map(([name, sub]) => [name, toJsonSchema(sub)]))]
      }
      return [key, ['items', 'allOf', 'anyOf', 'oneOf'].includes(key) ? toJsonSchema(value) : value]
    }),
  )
  if (converted.properties) converted.additionalProperties = false
  return nullable ? { anyOf: [{ type: 'null' }, converted] } : converted
}

const schemas = Object.fromEntries(
  Object.entries(document.components?.schemas ?? {}).map(([name, schema]) => [name, toJsonSchema(schema)]),
)
// Sin coerceTypes: convertiría null en 0 y un número obligatorio pasaría. El backend real sí convierte
// strings ("65"), pero el frontend debe enviar el tipo correcto.
const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false })
ajv.addSchema({ $id: 'contract', components: { schemas } })

function withAbsoluteRefs(schema) {
  return JSON.parse(JSON.stringify(schema).replaceAll('"#/components/', '"contract#/components/'))
}

// Las rutas literales van primero: /plans/standard/previews gana sobre /plans/standard/{code}.
const routes = Object.entries(document.paths)
  .filter(([template]) => template.startsWith(API_PREFIX))
  .map(([template, operations]) => {
    const relative = template.slice(API_PREFIX.length)
    const params = [...relative.matchAll(/\{(\w+)\}/g)].map((match) => match[1])
    const pattern = new RegExp(`^${relative.replace(/\{\w+\}/g, '([^/]+)')}$`)
    return { template: relative, params, pattern, operations }
  })
  .sort((a, b) => a.params.length - b.params.length)

const validators = new Map()

function validatorFor(template, method, operation) {
  const key = `${method} ${template}`
  if (!validators.has(key)) {
    const schema = operation.requestBody?.content?.['application/json']?.schema
    validators.set(key, schema ? ajv.compile(withAbsoluteRefs(schema)) : null)
  }
  return validators.get(key)
}

// Evalúa una request contra el contrato. `violation` explica por qué el backend real la rechazaría.
export function checkRequest(method, path, body) {
  const route = routes.find((candidate) => candidate.pattern.test(path) && candidate.operations[method.toLowerCase()])
  if (!route) return { violation: { kind: 'route-not-in-contract', detail: 'La ruta no existe en el backend real' } }

  const operation = route.operations[method.toLowerCase()]
  const successStatus = Number(Object.keys(operation.responses).find((status) => status.startsWith('2')) ?? 200)

  const values = route.pattern.exec(path).slice(1)
  for (const [index, name] of route.params.entries()) {
    if (UUID_PARAMS.has(name) && !UUID_V4.test(decodeURIComponent(values[index]))) {
      return { successStatus, violation: { kind: 'invalid-path-param', detail: `${name} no es un UUID v4` } }
    }
  }

  const validate = validatorFor(route.template, method, operation)
  if (validate) {
    // sin body, Express entrega {} al ValidationPipe: solo falla si el DTO tiene campos obligatorios
    const copy = body === undefined ? {} : JSON.parse(JSON.stringify(body))
    if (!validate(copy)) {
      const errors = (validate.errors ?? []).map((error) => `${error.instancePath || '(body)'} ${error.message}`)
      return { successStatus, violation: { kind: 'invalid-body', detail: errors.join('; ') } }
    }
  }
  return { successStatus }
}

// Rutas del contrato, para comprobar que el frontend solo llama a endpoints que existen.
export function contractOperations() {
  return routes.flatMap((route) =>
    Object.keys(route.operations).map((method) => ({ method: method.toUpperCase(), template: route.template })),
  )
}
