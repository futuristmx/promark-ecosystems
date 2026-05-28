-- CreateTable
CREATE TABLE "promark_billing_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "category" TEXT NOT NULL DEFAULT 'OPERATIVO',
    "order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promark_billing_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promark_billing_configs_key_key" ON "promark_billing_configs"("key");

-- Seed default billing concepts (idempotent: skip if key exists)
INSERT INTO "promark_billing_configs" ("id", "key", "label", "description", "amount", "category", "order", "updated_at", "created_at") VALUES
('cuid_brand_renewal',       'brand_renewal',       'Renovación de marca',          'Costo unitario por renovación de marca registrada (IMPI)', 5000,  'OPERATIVO',  10, NOW(), NOW()),
('cuid_use_declaration',     'use_declaration',     'Declaración de uso',           'Costo por declaración de uso obligatoria (3er año)',       2500,  'OPERATIVO',  20, NOW(), NOW()),
('cuid_new_registration',    'new_registration',    'Nuevo registro',               'Costo por solicitud de registro de marca nueva',           8000,  'OPERATIVO',  30, NOW(), NOW()),
('cuid_contract_renewal',    'contract_renewal',    'Renovación de contrato',       'Costo por revisión y renovación de contrato',              7500,  'OPERATIVO',  40, NOW(), NOW()),
('cuid_license_renewal',     'license_renewal',     'Renovación de licencia',       'Costo por renovación de licencia derivada',                4000,  'OPERATIVO',  50, NOW(), NOW()),
('cuid_monthly_service',     'monthly_service',     'Servicio mensual por cliente', 'Iguala mensual base por cliente (monitoreo y soporte)',    3000,  'RECURRENTE', 60, NOW(), NOW()),
('cuid_annual_audit',        'annual_audit',        'Auditoría anual',              'Auditoría legal-marcaria anual por cliente',              15000, 'RECURRENTE', 70, NOW(), NOW()),
('cuid_opposition_response', 'opposition_response', 'Respuesta a oposición',        'Honorarios por respuesta a anterioridad/oposición IMPI',  6500,  'EVENTUAL',   80, NOW(), NOW())
ON CONFLICT ("key") DO NOTHING;
