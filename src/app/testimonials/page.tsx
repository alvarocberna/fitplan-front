//FEATURES
import { TestimonialsAllPublic, TestimonialsServicePublic } from '@/features';

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