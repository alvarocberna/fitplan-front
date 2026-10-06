/**
 * Configuración centralizada de estilo y comportamiento visual
 * de los módulos públicos de integración (articulos, equipo, servicios).
 *
 * Modificar los valores de INTEGRATION_CONFIG cambia el comportamiento
 * y estilo por defecto en todos los componentes que los consumen.
 */

export type Behavior = 'navigate' | 'modal';
export type TwoVariantStyle = 'style1' | 'style2';
export type ThreeVariantStyle = 'style1' | 'style2' | 'style3';

export const INTEGRATION_CONFIG = {
    article: {
        style: 'style2' as TwoVariantStyle,
    },
    employee: {
        behavior: 'modal' as Behavior,
        style: 'style1' as TwoVariantStyle,
    },
    team: {
        behavior: 'modal' as Behavior,
        style: 'style1' as TwoVariantStyle,
    },
    service: {
        behavior: 'modal' as Behavior,
        style: 'style1' as ThreeVariantStyle,
    },
    services: {
        behavior: 'modal' as Behavior,
        style: 'style1' as ThreeVariantStyle,
    },
};
