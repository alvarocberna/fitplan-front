//FEATURES
import { TestimoniosAllPublic, TestimoniosServicePublic } from '@/features';

export default async function ProjectServiciosPage() {

    const [testimonios] = await Promise.all([
        TestimoniosServicePublic.getTestimonios()
    ])

    return (
        <div className="flex flex-col mt-20">
            <TestimoniosAllPublic dataTestimonios={testimonios}/>
        </div>
    );
}
