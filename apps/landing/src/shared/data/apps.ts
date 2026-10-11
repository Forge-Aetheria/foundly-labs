import type { Application } from '@/shared/types';

export const apps: Application[] = [
  {
    id: 'foundly-mobile-finance',
    name: 'Foundly',
    category: 'Finanzas Personales',
    status: 'En Desarrollo',
    target: 'iOS / Android (Expo)',
    headline: 'No es solo cuánto tienes. Es cuánto te queda después de tus planes.',
    subheadline:
      'La app que calcula tu Saldo Disponible real: ingresos, gastos, ahorros, deudas y dinero bloqueado, en una sola cifra.',
    description:
      'La mayoría de las apps te muestran un saldo que ignora lo que ya tienes comprometido. Foundly parte de una premisa distinta: tu liquidez real es la única cifra útil para decidir. Integra tu flujo de caja completo y descuenta compromisos, metas de ahorro y deudas. Todo local, privado y sin conectar tu banco.',
    keyFeature: 'Calculadora de Saldo Disponible real & Simulador What-If.',
    logo: '/foundly-finance/branding-logo.png',
    icon: '/foundly-finance/icon.png',
  },
  {
    id: 'foundly-pos',
    name: 'Foundly POS',
    category: 'Comercio & Ventas',
    status: 'Beta Activa',
    target: 'Mobile / Tablet (SQLite + Drizzle)',
    headline: 'Vende, controla tu stock y cuadra tu caja sin complicaciones.',
    subheadline:
      'El punto de venta para pequeños negocios que quiere saber, al minuto, qué vendió, qué le deben y cuánto ganó de verdad.',
    description:
      'Unifica ventas, inventario, clientes con crédito y caja en una sola herramienta. Registra una venta en segundos, controla tu stock, cobra a crédito y concilia cada cobro por canal sin depender de internet.',
    keyFeature: 'Gestión de cuentas por cobrar, inventario y cierres de caja en 100% offline.',
    logo: '/foundly-pos/branding-logo.png',
    icon: '/foundly-pos/icon.png',
  },
  {
    id: 'foundly-maker',
    name: 'Foundly Maker',
    category: 'Multimedia & Tools',
    status: 'Producción / Disponible',
    target: 'Web / Desktop (Vite + React)',
    headline: 'De letra suelta a karaoke sincronizado. Sin subir nada a la nube.',
    subheadline:
      'Estudio local-first en el navegador para marcar tiempos de letras sobre audio o video y exportar .lrc, .ass o .json.',
    description:
      'Estudio local en navegador para sincronizar audio/video con letras de canciones. Marca tiempos línea por línea o a nivel de palabra, ajusta con precisión al milisegundo, previsualiza con estilo Spotify y exporta archivos .lrc / .ass.',
    keyFeature:
      'Tipografía cinética a nivel de palabra, stamping táctil/teclado y exportación .lrc/.ass.',
    logo: '/foundly-maker/branding-logo.png',
    icon: '/foundly-maker/icon.png',
  },
  {
    id: 'mixbit',
    name: 'Mixbit',
    category: 'Trading Engine',
    status: 'En Desarrollo',
    target: 'Full-Stack (FastAPI + Next.js)',
    headline: 'Deja que el grid trabaje por ti. Tú decides hasta dónde arriesgar.',
    subheadline:
      'Motor de grid trading local-first con stop loss infranqueable, dashboard en tiempo real y señales de mercado.',
    description:
      'Grid trading automatizado dentro de un rango definido con stop loss inviolable y recuperación exacta del estado tras reinicios. Python en el backend (FastAPI + CCXT) e interfaz web en Next.js con gráficos en vivo, modo simulador y Market Scanner.',
    keyFeature: 'Stop Loss infranqueable, Market Scanner (ATR, Bollinger, EMAs) y simulador.',
    logo: '/mixbit/branding-logo.png',
    icon: '/mixbit/icon.png',
  },
];
