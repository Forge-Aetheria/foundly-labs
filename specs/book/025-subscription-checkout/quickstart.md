# Quickstart & Validation Guide

**Feature**: `specs/book/025-subscription-checkout` | **Date**: 2026-11-09

## Prerequisites

- Dependencias instaladas y API/Book configurados.
- API con `SUPABASE_AUTH_URL`, `BILLING_PRO_AMOUNT_USD`, `BILLING_PRO_DURATION_DAYS` y datos manuales (`BILLING_MANUAL_*`).
- Un tenant Free de prueba y un pago/transacción de prueba.
- Para PayPal/Binance reales: credenciales sandbox y URLs de retorno configuradas.

## 1. Codegen y tipos

```bash
corepack pnpm --filter @foundly/book codegen
corepack pnpm --filter @foundly/book typecheck
```

Resultado esperado:
- El snapshot incluye `BillingInstructions`, `MySubscription`, `MyPaymentTransactions` y las mutaciones.
- Book compila sin tipos manuales del contrato.

## 2. Arranque

```bash
corepack pnpm --filter @foundly/api dev
corepack pnpm --filter @foundly/book dev
```

Abrir:

```text
http://localhost:3001/admin/configuracion?tab=suscripcion
```

Resultado esperado:
- La pestaña “Suscripción” existe junto a Perfil, Métodos de Pago y Seguridad.
- Se muestra el plan actual, estado, vencimiento y uso.
- Si faltan `billingInstructions`, se muestra un estado “No disponible” y no se inventan precios.

## 3. Validación de estados

1. **Free**: plan Free, límites 1/1 y CTA de upgrade.
2. **Pro**: plan Pro, vencimiento y límites ilimitados.
3. **Vencido**: plan efectivo Free y aviso de vencimiento.
4. **Pago pendiente**: estado “Pendiente” y plan anterior intacto.
5. **Historial**: transacciones ordenadas, con gateway/estado/importe/moneda/fecha.

## 4. PayPal / Binance

1. Pulsar PayPal.
2. Verificar que se crea la transacción y que el navegador redirige a `checkoutUrl`.
3. Volver a `/admin/configuracion?tab=suscripcion&checkout=return`.
4. Confirmar que se refresca el estado y que no se asume un plan activo hasta la confirmación.

Repetir con Binance. Un fallo del proveedor debe mostrar una alerta con reintento.

## 5. Pago manual

1. Elegir Pago Móvil o Transferencia.
2. Verificar banco, cédula/RIF, teléfono y tasa desde la API.
3. Enviar referencia, banco, monto, moneda y teléfono.
4. Confirmar:
   - Estado `PENDING_APPROVAL`.
   - El plan no cambia.
   - El pago aparece en el historial.
5. Repetir con la misma referencia → error inline, sin nueva transacción.
6. Super Admin aprueba la transacción; al refrescar Book, el plan y vencimiento se actualizan.

## 6. Accesibilidad y errores

- Navegar la pestaña solo con teclado.
- Verificar labels, foco visible y `role="alert"`/`role="status"`.
- Simular sesión expirada → limpieza y login.
- Simular error de proveedor → alerta accionable.
- Simular `PLAN_LIMIT_REACHED` en servicios/equipo → enlace a la pestaña de suscripción.

## 7. Gates

```bash
corepack pnpm --filter @foundly/book typecheck
corepack pnpm --filter @foundly/book lint
corepack pnpm --filter @foundly/book test
corepack pnpm --filter @foundly/book build
```

Resultado esperado: todo en verde, sin regresiones de rutas, configuración ni sesión.
