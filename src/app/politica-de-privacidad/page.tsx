//NEXT
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Qué datos personales trata Fitplan, para qué los usa, con quién los comparte y cómo ejercer tus derechos.',
}

const CONTACT_EMAIL = 'fitplan900@gmail.com'
const LAST_UPDATED = '10 de octubre de 2026'

// Página pública y estática (sin sesión): es la URL de política de privacidad que se declara en la
// pantalla de consentimiento de Google (login federado de Cognito). Si cambia qué datos se tratan o
// con qué proveedores, este texto debe actualizarse junto con LAST_UPDATED.
export default function PrivacyPolicyPage() {
  return (
    <div className="w-full min-h-screen px-6 pt-40 pb-20">
      <article className="w-full max-w-3xl mx-auto text-zinc-800">
        <h1 className="text-2xl md:text-4xl font-bold mb-2">Política de privacidad</h1>
        <p className="text-sm text-zinc-500 mb-10">Última actualización: {LAST_UPDATED}</p>

        <p className="mb-4 leading-relaxed">
          En Fitplan (en adelante, &quot;Fitplan&quot; o &quot;nosotros&quot;) respetamos tu privacidad. Esta política
          explica qué datos personales tratamos cuando usas nuestro sitio y nuestros servicios de consulta
          nutricional virtual y planes de alimentación, para qué los usamos, con quién los compartimos y cómo
          puedes ejercer tus derechos, de acuerdo con la legislación chilena sobre protección de datos
          personales (Ley N° 19.628 y sus modificaciones).
        </p>
        <p className="mb-4 leading-relaxed">
          Al crear una cuenta o usar el servicio aceptas el tratamiento de tus datos en los términos descritos
          aquí.
        </p>

        <Section title="1. Responsable del tratamiento">
          <p className="mb-4 leading-relaxed">
            El responsable del tratamiento de tus datos es Fitplan. Para cualquier consulta sobre esta política
            o sobre tus datos, escríbenos a <ContactLink />.
          </p>
        </Section>

        <Section title="2. Datos que tratamos">
          <ul className="list-disc pl-6 mb-4 space-y-2 leading-relaxed">
            <li>
              <strong>Datos de la cuenta:</strong> tu correo electrónico y un identificador de usuario. Si inicias
              sesión con Google, recibimos de Google tu correo electrónico y los datos básicos de tu perfil; no
              recibimos ni almacenamos tu contraseña de Google.
            </li>
            <li>
              <strong>Datos de perfil:</strong> nombre, apellido, sexo, fecha de nacimiento y si practicas deporte.
            </li>
            <li>
              <strong>Datos de salud y hábitos:</strong> lo que nos cuentas en la consulta (objetivos, hábitos de
              alimentación, actividad física, antecedentes de salud y otra información de la anamnesis) y tus
              mediciones corporales (por ejemplo, peso, talla y composición corporal). Son datos sensibles: los
              usamos únicamente para elaborar tu plan y mostrarte tu evolución.
            </li>
            <li>
              <strong>Datos de compra:</strong> las órdenes que generas, su monto y el estado del pago. El pago se
              realiza en Webpay (Transbank): no recibimos ni almacenamos los datos de tu tarjeta.
            </li>
            <li>
              <strong>Datos técnicos:</strong> información mínima necesaria para operar el servicio de forma
              segura, como dirección IP y registros de actividad del servidor.
            </li>
          </ul>
        </Section>

        <Section title="3. Para qué usamos tus datos">
          <ul className="list-disc pl-6 mb-4 space-y-2 leading-relaxed">
            <li>Crear y administrar tu cuenta, y mantener tu sesión iniciada.</li>
            <li>Realizar la consulta nutricional y generar tu plan de alimentación personalizado.</li>
            <li>Mostrarte tus planes, consultas y mediciones anteriores.</li>
            <li>Gestionar tus órdenes y confirmar tus pagos.</li>
            <li>Enviarte comunicaciones relacionadas con el servicio, como la entrega de tu plan.</li>
            <li>Prevenir fraudes y abusos, y cumplir nuestras obligaciones legales.</li>
          </ul>
          <p className="mb-4 leading-relaxed">
            No vendemos tus datos personales ni los usamos para publicidad de terceros.
          </p>
        </Section>

        <Section title="4. Uso de inteligencia artificial">
          <p className="mb-4 leading-relaxed">
            La consulta y la generación del plan se realizan con modelos de inteligencia artificial. Para ello,
            la información que entregas en la consulta y tus mediciones se envían a nuestro proveedor de
            modelos de lenguaje, que las procesa por nuestra cuenta con el único fin de responderte y elaborar
            tu plan.
          </p>
          <p className="mb-4 leading-relaxed">
            El plan que recibes es una orientación nutricional generada automáticamente. No constituye un
            diagnóstico ni reemplaza la atención de un profesional de la salud.
          </p>
        </Section>

        <Section title="5. Con quién compartimos tus datos">
          <p className="mb-4 leading-relaxed">
            Compartimos tus datos solo con los proveedores que necesitamos para prestar el servicio, y
            únicamente en la medida necesaria:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2 leading-relaxed">
            <li>
              <strong>Amazon Web Services:</strong> alojamiento del sitio, base de datos, almacenamiento de los
              planes y gestión de cuentas e inicio de sesión.
            </li>
            <li>
              <strong>OpenAI:</strong> procesamiento de la consulta y generación del plan mediante inteligencia
              artificial.
            </li>
            <li>
              <strong>Transbank (Webpay):</strong> procesamiento de los pagos.
            </li>
            <li>
              <strong>Google:</strong> inicio de sesión, solo si eliges &quot;Continuar con Google&quot;.
            </li>
          </ul>
          <p className="mb-4 leading-relaxed">
            Algunos de estos proveedores almacenan o procesan los datos en servidores ubicados fuera de Chile,
            principalmente en Estados Unidos. También podremos entregar información cuando una autoridad
            competente lo exija conforme a la ley.
          </p>
        </Section>

        <Section title="6. Cuánto tiempo conservamos tus datos">
          <p className="mb-4 leading-relaxed">
            Conservamos tus datos mientras mantengas tu cuenta, para que puedas consultar tus planes y tu
            historial. Si inicias una consulta y la orden no se paga, la información de esa consulta se elimina
            cuando la orden expira. Puedes pedirnos en cualquier momento que eliminemos tu cuenta y tus datos;
            lo haremos salvo en aquello que debamos conservar por obligación legal, como los registros de las
            compras.
          </p>
        </Section>

        <Section title="7. Tus derechos">
          <p className="mb-4 leading-relaxed">
            Puedes solicitar el acceso a tus datos, su rectificación si son inexactos, su eliminación, oponerte
            a su tratamiento o retirar tu consentimiento. Para hacerlo, escríbenos a <ContactLink /> desde el
            correo asociado a tu cuenta. Responderemos dentro de los plazos que establece la ley.
          </p>
        </Section>

        <Section title="8. Cookies y almacenamiento local">
          <p className="mb-4 leading-relaxed">
            Usamos una cookie estrictamente necesaria para mantener tu sesión iniciada, y el almacenamiento
            local de tu navegador para guardar el avance de tu consulta y tu selección de plan. No usamos
            cookies publicitarias ni de seguimiento de terceros.
          </p>
        </Section>

        <Section title="9. Seguridad">
          <p className="mb-4 leading-relaxed">
            Aplicamos medidas técnicas y organizativas razonables para proteger tus datos: las comunicaciones
            viajan cifradas, el acceso a tu información exige que inicies sesión y los archivos de tus planes
            solo se entregan mediante enlaces temporales. Ningún sistema es completamente infalible; si
            detectamos un incidente que afecte tus datos, te lo informaremos.
          </p>
        </Section>

        <Section title="10. Cambios a esta política">
          <p className="mb-4 leading-relaxed">
            Podemos actualizar esta política. Publicaremos la versión vigente en esta página, con su fecha de
            actualización. Si los cambios son importantes, te avisaremos por correo o dentro del sitio.
          </p>
        </Section>

        <Section title="11. Contacto">
          <p className="mb-4 leading-relaxed">
            Si tienes dudas sobre esta política o sobre el tratamiento de tus datos, escríbenos a{' '}
            <ContactLink />.
          </p>
        </Section>

        <Link href="/" className="inline-block mt-6 text-sm text-zinc-600 hover:text-zinc-900 underline">
          Volver al inicio
        </Link>
      </article>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg md:text-xl font-semibold mb-4">{title}</h2>
      {children}
    </section>
  )
}

function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-zinc-900">
      {CONTACT_EMAIL}
    </a>
  )
}
