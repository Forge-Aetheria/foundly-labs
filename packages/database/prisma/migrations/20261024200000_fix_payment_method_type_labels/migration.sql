-- Align legacy PaymentMethodType labels with the current Prisma schema.
--
-- Production was baselined with `prisma db push`, so it already uses the current
-- labels and this migration is a no-op there. A database created purely from the
-- migration history gets the legacy labels from
-- `20261013180000_add_advance_payments`, which are corrected here.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'PaymentMethodType' AND e.enumlabel = 'mobile_payment'
  ) THEN
    ALTER TYPE "PaymentMethodType" RENAME VALUE 'mobile_payment' TO 'pago_movil';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'PaymentMethodType' AND e.enumlabel = 'bank_transfer'
  ) THEN
    ALTER TYPE "PaymentMethodType" RENAME VALUE 'bank_transfer' TO 'transfer';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'PaymentMethodType' AND e.enumlabel = 'zelle'
  ) THEN
    ALTER TYPE "PaymentMethodType" ADD VALUE 'zelle';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'PaymentMethodType' AND e.enumlabel = 'cash'
  ) THEN
    ALTER TYPE "PaymentMethodType" ADD VALUE 'cash';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'PaymentMethodType' AND e.enumlabel = 'binance'
  ) THEN
    ALTER TYPE "PaymentMethodType" ADD VALUE 'binance';
  END IF;
END $$;
