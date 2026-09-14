import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

// jsdom no implementa matchMedia; gsap/ScrollTrigger lo invoca al registrarse
// (arrastrado transitivamente por el barrel @/features vía articles.component.tsx)
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// jsdom no implementa scrollIntoView (usado por el auto-scroll de ChatAnamnesis)
Element.prototype.scrollIntoView = vi.fn();

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// El paquete server-only lanza al importarse fuera del bundler de Next (que lo sustituye por un
// no-op al compilar para el servidor). Vitest no hace esa sustitución, así que cualquier módulo
// server-only (client.ts, session.ts, tokens.ts, ...) rompería sus tests sin este mock.
vi.mock('server-only', () => ({}));
