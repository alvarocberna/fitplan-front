import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './card';

// El texto es hijo directo del contenedor interno; la card (con las clases de fondo) es su padre
function outerCard(text: string) {
  return screen.getByText(text).parentElement!;
}

describe('Card', () => {
  it('uses the translucent glass background by default, so other screens are unchanged', () => {
    render(<Card>contenido</Card>);

    const card = outerCard('contenido');
    expect(card).toHaveClass('bg-white/30', 'backdrop-blur-md');
    expect(card).not.toHaveClass('bg-white');
  });

  it('renders an opaque white background with the "solid" variant (/panel and /perfil)', () => {
    render(<Card variant="solid">contenido</Card>);

    const card = outerCard('contenido');
    expect(card).toHaveClass('bg-white');
    expect(card).not.toHaveClass('bg-white/30');
    expect(card).not.toHaveClass('backdrop-blur-md');
  });

  it('keeps the shared shape and applies the width props to the outer and inner containers', () => {
    render(<Card variant="solid" width="50%" widthInner="80%">contenido</Card>);

    const card = outerCard('contenido');
    expect(card).toHaveClass('rounded-[12px]', 'shadow-lg', 'border');
    expect(card).toHaveStyle({ width: '50%' });
    expect(screen.getByText('contenido')).toHaveStyle({ width: '80%' });
  });
});
