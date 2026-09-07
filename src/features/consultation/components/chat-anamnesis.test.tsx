import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';
import { ChatAnamnesis } from './chat-anamnesis';
import { ConsultationProvider } from '@/shared';
import { ConsultationService } from '@/features';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/features', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features')>();
  return { ...actual, ConsultationService: { sendAnamnesisTurn: vi.fn() } };
});

const sendAnamnesisTurn = vi.mocked(ConsultationService.sendAnamnesisTurn);

function renderChat() {
  return render(
    <ConsultationProvider>
      <ChatAnamnesis />
    </ConsultationProvider>
  );
}

beforeEach(() => {
  pushMock.mockClear();
  vi.mocked(toast.error).mockClear();
  sendAnamnesisTurn.mockReset();
});

describe('ChatAnamnesis', () => {
  it('renders the opening message and keeps send disabled with empty or whitespace-only input', async () => {
    const user = userEvent.setup();
    renderChat();

    expect(screen.getByText('Definición de objetivos')).toBeInTheDocument();
    const sendButton = screen.getByRole('button', { name: 'Enviar' });
    expect(sendButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/Escribe tu respuesta/), '   ');
    expect(sendButton).toBeDisabled();
  });

  it('sends the message on Enter, stripping titleReply from the outgoing history', async () => {
    sendAnamnesisTurn.mockResolvedValue({
      reply: 'Cuéntame más',
      titleReply: 'Objetivos',
      anamnesis: { goals: null, clinical: null, dietary: null, lifestyle: null },
      isComplete: false,
    });
    const user = userEvent.setup();
    renderChat();

    const textarea = screen.getByPlaceholderText(/Escribe tu respuesta/);
    await user.type(textarea, 'Quiero bajar de peso');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Quiero bajar de peso')).toBeInTheDocument();
    await waitFor(() => expect(sendAnamnesisTurn).toHaveBeenCalledTimes(1));

    const [sentPayload] = sendAnamnesisTurn.mock.calls[0];
    expect(sentPayload.messages.every((m) => Object.keys(m).sort().join(',') === 'content,role')).toBe(true);
    expect(sentPayload.messages.at(-1)).toEqual({ role: 'user', content: 'Quiero bajar de peso' });

    await waitFor(() => expect(screen.getByText('Cuéntame más')).toBeInTheDocument());
  });

  it('inserts a newline on Shift+Enter instead of sending', async () => {
    const user = userEvent.setup();
    renderChat();
    const textarea = screen.getByPlaceholderText(/Escribe tu respuesta/) as HTMLTextAreaElement;

    await user.type(textarea, 'linea 1{Shift>}{Enter}{/Shift}linea 2');

    expect(sendAnamnesisTurn).not.toHaveBeenCalled();
    expect(textarea.value).toBe('linea 1\nlinea 2');
  });

  it('shows an error toast and keeps the optimistic user message when the service call fails', async () => {
    sendAnamnesisTurn.mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    renderChat();

    await user.type(screen.getByPlaceholderText(/Escribe tu respuesta/), 'Hola');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error al enviar el mensaje'));
    expect(screen.getByText('Hola')).toBeInTheDocument();
    // el textarea se limpió de forma optimista, pero ya no está en isLoading: puede volver a escribirse y enviarse
    await user.type(screen.getByPlaceholderText(/Escribe tu respuesta/), 'De nuevo');
    expect(screen.getByRole('button', { name: 'Enviar' })).not.toBeDisabled();
  });

  it('replaces the input with a "Siguiente" button once isComplete, and advances/persists on click', async () => {
    const finalAnamnesis = {
      goals: { primaryGoal: 'bajar de peso', secondaryGoal: null },
      clinical: null,
      dietary: null,
      lifestyle: null,
    };
    sendAnamnesisTurn.mockResolvedValue({ reply: 'Listo', titleReply: 'Resumen', anamnesis: finalAnamnesis, isComplete: true });
    const user = userEvent.setup();
    renderChat();

    await user.type(screen.getByPlaceholderText(/Escribe tu respuesta/), 'Hola');
    await user.keyboard('{Enter}');

    const nextButton = await screen.findByRole('button', { name: 'Siguiente' });
    await user.click(nextButton);

    expect(pushMock).toHaveBeenCalledWith('/consulta/evaluacion-fisica');
    const stored = JSON.parse(localStorage.getItem('consulta_context')!);
    expect(stored.anamnesis).toEqual(finalAnamnesis);
  });
});
