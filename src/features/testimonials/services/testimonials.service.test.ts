import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestimonialsServicePublic } from './testimonials.service';
import { apiFetchCMS } from '@/shared';
import type { CreateTestimonialDtoPublic } from '../dtos/create-testimonial.dto';

vi.mock('@/shared', () => ({ apiFetchCMS: vi.fn() }));

const mockedFetch = vi.mocked(apiFetchCMS);

beforeEach(() => {
  mockedFetch.mockReset();
  vi.stubEnv('NEXT_PUBLIC_PROYECTO_ID', 'proj-1');
});

describe('TestimonialsServicePublic', () => {
  it('getTestimonials requests the project testimonial list with the project id', async () => {
    mockedFetch.mockResolvedValue({ testimonio: [] } as any);

    await TestimonialsServicePublic.getTestimonials();

    expect(mockedFetch).toHaveBeenCalledWith('testimonios/project/ver-todo?proyecto_id=proj-1', 'GET');
  });

  it('createTestimonial posts the payload to the create endpoint with the project id', async () => {
    mockedFetch.mockResolvedValue(undefined);
    const data: CreateTestimonialDtoPublic = {
      nombre: 'Ana', apellido: 'Pérez', correo: 'ana@test.com', descripcion: 'Excelente', calificacion: 5, status: 'pendiente',
    };

    await TestimonialsServicePublic.createTestimonial(data);

    expect(mockedFetch).toHaveBeenCalledWith('testimonios/project/testimonio/crear?proyecto_id=proj-1', 'POST', data);
  });
});
