import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Line } from '@nivo/line';
import { POINT_PROPS } from './measurements-chart.component';

// Renderiza nivo de verdad (sin stub, con medidas fijas) para comprobar que la configuración de los
// puntos del gráfico de evolución produce puntos visibles: con una clave de color que nivo no
// resuelve, el punto quedaba blanco y sin borde sobre el fondo blanco.
describe('MeasurementsChart - puntos', () => {
  it('dibuja un punto por medición relleno con el color de su serie', () => {
    const { container } = render(
      <Line
        data={[{ id: 'weight', color: '#2563eb', data: [{ x: new Date(2026, 8, 20), y: 80 }, { x: new Date(2026, 8, 27), y: 78 }] }]}
        width={400}
        height={300}
        animate={false}
        xScale={{ type: 'time', format: 'native' }}
        colors={{ datum: 'color' }}
        {...POINT_PROPS}
      />,
    );

    const circles = [...container.querySelectorAll('circle')];
    expect(circles).toHaveLength(2);
    for (const circle of circles) {
      expect(circle.getAttribute('fill')).toBe('#2563eb');
      expect(circle.getAttribute('stroke')).toBe('#ffffff');
    }
  });
});
