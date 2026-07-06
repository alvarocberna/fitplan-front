# Nutri-Agente (Front)

Aplicación web construida con [Next.js](https://nextjs.org) que sirve como interfaz de un agente de IA experto en nutrición deportiva. El sistema guía al usuario a través de un flujo de consulta (datos personales, anamnesis conversacional y evaluación física), envía la información recopilada a un backend para su procesamiento, y genera un plan nutricional en formato PDF que el usuario puede descargar o recibir por correo tras completar el pago.

## Flujo principal

1. **Inicio** — el usuario ingresa a la landing page y comienza la consulta.
2. **Información personal** (`/consulta/informacion-personal`) — formulario de datos personales.
3. **Anamnesis** (`/consulta/anamnesis`) — chat interactivo que completa progresivamente la información clínica/nutricional del usuario contra el backend.
4. **Evaluación física** (`/consulta/evaluacion-fisica`) — mediciones (peso, talla) que se combinan con los datos anteriores y se envían al backend.
5. **Plan nutricional** (`/consulta/plan-nutricional`) — visualización y generación del documento PDF con el plan resultante.

El estado de la consulta se administra mediante `ConsultaProvider` (React Context) y persiste en `localStorage` para no perderse entre pasos. Más detalle del flujo y el modelo de datos en [`doc/readme.md`](./doc/readme.md).

## Stack

- [Next.js](https://nextjs.org) 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- React Hook Form para formularios
- `@react-pdf/renderer` para la generación del plan en PDF
- `@nivo` para gráficos
- FontAwesome / Heroicons para iconografía

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
