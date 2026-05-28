-- CreateTable
CREATE TABLE "promark_role_configs" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "label" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promark_role_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promark_role_configs_role_key" ON "promark_role_configs"("role");
