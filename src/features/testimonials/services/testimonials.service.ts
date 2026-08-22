import { apiFetchCMS } from '@/shared';
import { TestimonialsEntityPublic } from '../entities/testimonials.entity';
import { CreateTestimonialDtoPublic } from '../dtos/create-testimonial.dto';

export class TestimonialsServicePublic {

    public static async getTestimonials(): Promise<TestimonialsEntityPublic | null> {
        const projectId = process.env.NEXT_PUBLIC_PROYECTO_ID;
        return await apiFetchCMS<TestimonialsEntityPublic>(`testimonios/project/ver-todo?proyecto_id=${projectId}`, 'GET');
    }

    public static async createTestimonial(data: Omit<CreateTestimonialDtoPublic, never>): Promise<void> {
        const projectId = process.env.NEXT_PUBLIC_PROYECTO_ID;
        await apiFetchCMS<void>(`testimonios/project/testimonio/crear?proyecto_id=${projectId}`, 'POST', data);
    }

}