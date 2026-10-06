import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Modal } from './modal.component';

describe('Modal', () => {
  it('no renderiza nada cuando está cerrado', () => {
    render(<Modal open={false} onClose={vi.fn()} title="Título">contenido</Modal>);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abierto: es un diálogo modal nombrado por su título, con su contenido', () => {
    render(<Modal open onClose={vi.fn()} title="Mi título">contenido</Modal>);

    const dialog = screen.getByRole('dialog', { name: 'Mi título' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveTextContent('contenido');
  });

  it('se dibuja en un portal a document.body (no dentro del árbol del padre)', () => {
    const { container } = render(<div data-testid="padre"><Modal open onClose={vi.fn()} title="T">x</Modal></div>);

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('se cierra con Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal open onClose={onClose} title="T">x</Modal>);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se cierra con el botón "Cerrar" y al hacer clic en el fondo, pero no al hacer clic dentro del diálogo', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal open onClose={onClose} title="T"><p>dentro</p></Modal>);

    await user.click(screen.getByText('dentro'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    //el fondo es el padre directo del diálogo
    await user.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('bloquea el scroll de la página mientras está abierto y lo restaura al cerrarse', () => {
    const { rerender } = render(<Modal open onClose={vi.fn()} title="T">x</Modal>);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Modal open={false} onClose={vi.fn()} title="T">x</Modal>);
    expect(document.body.style.overflow).toBe('');
  });

  it('enfoca el diálogo al abrir y devuelve el foco al elemento que lo abrió al cerrar', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Abrir</button>
          <Modal open={open} onClose={() => setOpen(false)} title="T">x</Modal>
        </>
      );
    }
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Abrir' });

    await user.click(trigger);
    expect(screen.getByRole('dialog')).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('mantiene el foco dentro del diálogo al tabular (Tab desde el último vuelve al primero)', async () => {
    const user = userEvent.setup();
    render(
      <Modal open onClose={vi.fn()} title="T">
        <input aria-label="uno" />
        <input aria-label="dos" />
      </Modal>
    );

    //primero: el botón Cerrar, luego los dos inputs
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(screen.getByLabelText('dos')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
  });

  it('re-renderizar el padre no le roba el foco a un input del contenido', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [text, setText] = useState('');
      return (
        <Modal open onClose={() => {}} title="T">
          <input aria-label="campo" value={text} onChange={(e) => setText(e.target.value)} />
        </Modal>
      );
    }
    render(<Harness />);

    await user.click(screen.getByLabelText('campo'));
    await user.keyboard('abc');

    expect(screen.getByLabelText('campo')).toHaveValue('abc');
    expect(screen.getByLabelText('campo')).toHaveFocus();
  });
});
