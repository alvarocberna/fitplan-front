
// Los 4 planes predefinidos que se venden. Cada uno existe en 28 versiones (peso × sexo × edad) que
// el sistema elige según lo que complete el usuario, ver plan-code.ts. El slug es el prefijo del
// código de la versión, así que debe coincidir con los que reconoce el backend. El precio no vive
// acá: lo define cada versión en la base de datos y llega desde el backend.
//
// Los textos y la imagen son provisionales hasta tener el contenido definitivo de cada plan.
export const PLANS = [
    {
        id: 1,
        title: 'Plan Gimnasio Volumen',
        slug: 'plan-gimnasio-volumen',
        description: ['Plan para aumentar masa muscular'],
        imgUrl: '/images/img_informe1.jpg',
    },
    {
        id: 2,
        title: 'Plan Gimnasio Definición',
        slug: 'plan-gimnasio-definicion',
        description: ['Plan para bajar de peso'],
        imgUrl: '/images/img_informe1.jpg',
    },
    {
        id: 3,
        title: 'Plan Running',
        slug: 'plan-running',
        description: ['Plan para corredores'],
        imgUrl: '/images/img_informe1.jpg',
    },
    {
        id: 4,
        title: 'Plan Deporte de Cancha',
        slug: 'plan-deporte-cancha',
        description: ['Plan para deportes de cancha'],
        imgUrl: '/images/img_informe1.jpg',
    },
]
