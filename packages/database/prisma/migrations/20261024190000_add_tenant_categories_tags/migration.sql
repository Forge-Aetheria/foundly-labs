-- CreateEnum
CREATE TYPE "TenantCategory" AS ENUM ('BARBERIAS_PELUQUERIAS', 'SALUD_BIENESTAR', 'DEPORTES_ENTRENAMIENTO', 'CONSULTORIA_SERVICIOS', 'OTROS');

-- Add tags array
ALTER TABLE "Tenant" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Convert the legacy free-form category into the master enum, preserving known values.
ALTER TABLE "Tenant"
ALTER COLUMN "category" TYPE "TenantCategory"
USING (
  CASE
    WHEN "category" ILIKE '%barber%' OR "category" ILIKE '%peluquer%' THEN 'BARBERIAS_PELUQUERIAS'
    WHEN "category" ILIKE '%salud%' OR "category" ILIKE '%bienestar%' OR "category" ILIKE '%estética%' OR "category" ILIKE '%estetica%' OR "category" ILIKE '%masaje%' THEN 'SALUD_BIENESTAR'
    WHEN "category" ILIKE '%deporte%' OR "category" ILIKE '%entrenamiento%' OR "category" ILIKE '%gimnasio%' THEN 'DEPORTES_ENTRENAMIENTO'
    WHEN "category" ILIKE '%consultor%' OR "category" ILIKE '%servicio%' THEN 'CONSULTORIA_SERVICIOS'
    ELSE 'OTROS'
  END
)::"TenantCategory";
