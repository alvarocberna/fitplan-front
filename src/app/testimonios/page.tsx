//FEATURES
import { TestimonialsAllPublic, TestimonialsServicePublic } from '@/features';

// Se renderiza en cada petición y no en el build: los testimonios vienen del CMS, y si el CMS no está
// disponible al construir, el prerender falla y corta el build completo.
export const dynamic = 'force-dynamic'

export default async function TestimonialsPage() {

    const [testimonials] = await Promise.all([
        TestimonialsServicePublic.getTestimonials()
    ])

    return (
        <div className="flex flex-col mt-20">
            <TestimonialsAllPublic testimonialsData={testimonials}/>
        </div>
    );
}