
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ONBOARDING');

-- CreateEnum
CREATE TYPE "PromarkRole" AS ENUM ('SUPERADMIN', 'LAWYER', 'BRAND_ANALYST', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ClientRole" AS ENUM ('CLIENT_ADMIN', 'CLIENT_VIEWER', 'CLIENT_LEGAL_REP');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "HoldingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISSOLVED');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('PARENT', 'SUBSIDIARY', 'AFFILIATE');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MERGED', 'DISSOLVED');

-- CreateEnum
CREATE TYPE "LegalStatus" AS ENUM ('APPLIED', 'PUBLISHED', 'REGISTERED', 'RENEWED', 'EXPIRED', 'CANCELLED', 'OPPOSED', 'IN_LITIGATION');

-- CreateEnum
CREATE TYPE "BrandType" AS ENUM ('WORDMARK', 'FIGURATIVE', 'MIXED', 'THREE_D', 'SOUND', 'HOLOGRAM', 'TRADE_DRESS');

-- CreateEnum
CREATE TYPE "BrandClassStatus" AS ENUM ('ACTIVE', 'PENDING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BrandEventType" AS ENUM ('REGISTRATION', 'RENEWAL', 'TRANSFER', 'OPPOSITION', 'CANCELLATION', 'STATUS_CHANGE', 'MODIFICATION', 'LITIGATION_START', 'LITIGATION_END', 'ASSIGNMENT', 'LICENSE_GRANT');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('PROMARK', 'CLIENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('PARENT_CHILD', 'COEXISTENCE', 'OPPOSITION', 'FAMILY', 'RELATED_DESIGN', 'TRANSLATION');

-- CreateEnum
CREATE TYPE "HolderType" AS ENUM ('INDIVIDUAL', 'CORPORATION');

-- CreateEnum
CREATE TYPE "HolderRoleType" AS ENUM ('OWNER', 'CO_OWNER', 'LICENSEE', 'LEGAL_REPRESENTATIVE', 'AGENT');

-- CreateEnum
CREATE TYPE "HolderStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('LICENSE_INTERNAL', 'LICENSE_EXTERNAL', 'COEXISTENCE', 'ASSIGNMENT', 'FRANCHISE', 'DISTRIBUTION', 'SETTLEMENT', 'NDA');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('EXCLUSIVE', 'NON_EXCLUSIVE', 'SUBLICENSE');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ContractChangeType" AS ENUM ('CREATED', 'UPDATED', 'TERMINATED', 'RENEWED', 'BRAND_LINKED', 'BRAND_UNLINKED', 'LICENSE_DERIVED', 'DOCUMENT_ATTACHED');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('CERTIFICATE', 'APPLICATION', 'POWER_OF_ATTORNEY', 'CONTRACT_COPY', 'CORRESPONDENCE', 'COURT_FILING', 'RENEWAL_PROOF', 'OTHER');

-- CreateEnum
CREATE TYPE "UserTypeEnum" AS ENUM ('PROMARK', 'CLIENT');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'PUSH');

-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('DRAFT', 'PUSHED', 'ROLLED_BACK');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "custom_domain" TEXT,
    "config" JSONB NOT NULL,
    "active_modules" JSONB NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ONBOARDING',
    "language" TEXT NOT NULL DEFAULT 'es',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_promarks" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "PromarkRole" NOT NULL,
    "avatar" JSONB,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "supabase_auth_id" TEXT NOT NULL,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_promarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_clients" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pin_hash" TEXT NOT NULL,
    "pin_generated_at" TIMESTAMP(3) NOT NULL,
    "pin_expires_at" TIMESTAMP(3),
    "card_id" TEXT NOT NULL,
    "pin_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_at" TIMESTAMP(3),
    "role" "ClientRole" NOT NULL,
    "avatar" JSONB,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holdings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "rfc" TEXT,
    "country" TEXT NOT NULL DEFAULT 'México',
    "notes" TEXT,
    "status" "HoldingStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "holding_id" TEXT NOT NULL,
    "parent_company_id" TEXT,
    "name" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "rfc" TEXT,
    "company_type" "CompanyType" NOT NULL,
    "incorporation_date" TIMESTAMP(3),
    "country" TEXT NOT NULL DEFAULT 'México',
    "state" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logos" JSONB,
    "registration_number" TEXT,
    "application_number" TEXT,
    "application_date" TIMESTAMP(3),
    "registration_date" TIMESTAMP(3),
    "expiration_date" TIMESTAMP(3),
    "renewal_date" TIMESTAMP(3),
    "legal_status" "LegalStatus" NOT NULL,
    "brand_type" "BrandType" NOT NULL,
    "description" TEXT,
    "disclaimers" TEXT,
    "priority_claim" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_classes" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "class_number" INTEGER NOT NULL,
    "class_description" TEXT,
    "specification" TEXT,
    "status" "BrandClassStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_history" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "event_type" "BrandEventType" NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "previous_state" JSONB,
    "new_state" JSONB,
    "description" TEXT,
    "documents" JSONB,
    "actor_type" "ActorType" NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "change_type" TEXT,
    "visible_to_client" BOOLEAN NOT NULL DEFAULT true,
    "performed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_relationships" (
    "id" TEXT NOT NULL,
    "brand_a_id" TEXT NOT NULL,
    "brand_b_id" TEXT NOT NULL,
    "relationship_type" "RelationshipType" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "holder_type" "HolderType" NOT NULL,
    "name" TEXT NOT NULL,
    "rfc" TEXT,
    "curp" TEXT,
    "nationality" TEXT,
    "address" JSONB,
    "contact_info" JSONB,
    "notes" TEXT,
    "status" "HolderStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_holders" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "holder_id" TEXT NOT NULL,
    "role" "HolderRoleType" NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_holders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_type" "ContractType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "parties" JSONB,
    "effective_date" TIMESTAMP(3),
    "expiration_date" TIMESTAMP(3),
    "renewal_terms" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "financial_terms" JSONB,
    "governing_law" TEXT,
    "notes" TEXT,
    "terminated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT,
    "brand_id" TEXT NOT NULL,
    "license_type" "LicenseType" NOT NULL,
    "licensee_name" TEXT NOT NULL,
    "licensee_rfc" TEXT,
    "territory" TEXT[],
    "permitted_uses" TEXT,
    "prohibited_uses" TEXT,
    "effective_date" TIMESTAMP(3),
    "expiration_date" TIMESTAMP(3),
    "status" "LicenseStatus" NOT NULL DEFAULT 'DRAFT',
    "royalty_rate" DECIMAL(7,4),
    "royalty_terms" TEXT,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_history" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "change_type" "ContractChangeType" NOT NULL,
    "changed_by_user_id" TEXT,
    "changed_by_user_type" "UserTypeEnum" NOT NULL,
    "summary" TEXT NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_brands" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "scope" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT,
    "file_size" INTEGER,
    "storage_path" TEXT NOT NULL,
    "storage_url" TEXT,
    "document_category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_edited_by" TEXT,
    "last_edited_at" TIMESTAMP(3),
    "editable_remotely" BOOLEAN NOT NULL DEFAULT false,
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "previous_version_id" TEXT,
    "is_latest_version" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "trigger_days" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notify_email" BOOLEAN NOT NULL DEFAULT true,
    "notify_in_app" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "alert_rule_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "trigger_days" INTEGER,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "dismissed_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "user_type" "UserTypeEnum" NOT NULL,
    "module" TEXT NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_overrides" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_type" "UserTypeEnum" NOT NULL,
    "module" TEXT NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "created_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT NOT NULL,
    "user_type" "UserTypeEnum" NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "config_snapshot" JSONB NOT NULL,
    "modules_snapshot" JSONB NOT NULL,
    "status" "VersionStatus" NOT NULL DEFAULT 'DRAFT',
    "pushed_at" TIMESTAMP(3),
    "pushed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_client_holders" (
    "id" TEXT NOT NULL,
    "user_client_id" TEXT NOT NULL,
    "holder_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,
    "removed_at" TIMESTAMP(3),

    CONSTRAINT "user_client_holders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_promarks_email_key" ON "user_promarks"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_promarks_supabase_auth_id_key" ON "user_promarks"("supabase_auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_clients_card_id_key" ON "user_clients"("card_id");

-- CreateIndex
CREATE INDEX "user_clients_tenant_id_idx" ON "user_clients"("tenant_id");

-- CreateIndex
CREATE INDEX "user_clients_card_id_tenant_id_idx" ON "user_clients"("card_id", "tenant_id");

-- CreateIndex
CREATE INDEX "holdings_tenant_id_idx" ON "holdings"("tenant_id");

-- CreateIndex
CREATE INDEX "companies_tenant_id_idx" ON "companies"("tenant_id");

-- CreateIndex
CREATE INDEX "companies_holding_id_idx" ON "companies"("holding_id");

-- CreateIndex
CREATE INDEX "companies_parent_company_id_idx" ON "companies"("parent_company_id");

-- CreateIndex
CREATE INDEX "brands_tenant_id_idx" ON "brands"("tenant_id");

-- CreateIndex
CREATE INDEX "brands_company_id_idx" ON "brands"("company_id");

-- CreateIndex
CREATE INDEX "brands_expiration_date_idx" ON "brands"("expiration_date");

-- CreateIndex
CREATE INDEX "brand_history_brand_id_event_date_idx" ON "brand_history"("brand_id", "event_date");

-- CreateIndex
CREATE INDEX "brand_relationships_brand_a_id_idx" ON "brand_relationships"("brand_a_id");

-- CreateIndex
CREATE INDEX "brand_relationships_brand_b_id_idx" ON "brand_relationships"("brand_b_id");

-- CreateIndex
CREATE INDEX "holders_tenant_id_idx" ON "holders"("tenant_id");

-- CreateIndex
CREATE INDEX "brand_holders_brand_id_idx" ON "brand_holders"("brand_id");

-- CreateIndex
CREATE INDEX "brand_holders_holder_id_idx" ON "brand_holders"("holder_id");

-- CreateIndex
CREATE INDEX "contracts_tenant_id_idx" ON "contracts"("tenant_id");

-- CreateIndex
CREATE INDEX "contracts_tenant_id_deleted_at_idx" ON "contracts"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "licenses_tenant_id_idx" ON "licenses"("tenant_id");

-- CreateIndex
CREATE INDEX "licenses_brand_id_idx" ON "licenses"("brand_id");

-- CreateIndex
CREATE INDEX "licenses_contract_id_idx" ON "licenses"("contract_id");

-- CreateIndex
CREATE INDEX "licenses_tenant_id_deleted_at_idx" ON "licenses"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "contract_history_contract_id_created_at_idx" ON "contract_history"("contract_id", "created_at");

-- CreateIndex
CREATE INDEX "contract_brands_contract_id_idx" ON "contract_brands"("contract_id");

-- CreateIndex
CREATE INDEX "contract_brands_brand_id_idx" ON "contract_brands"("brand_id");

-- CreateIndex
CREATE INDEX "documents_tenant_id_idx" ON "documents"("tenant_id");

-- CreateIndex
CREATE INDEX "documents_entity_type_entity_id_idx" ON "documents"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "documents_tenant_id_deleted_at_idx" ON "documents"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "alert_rules_tenant_id_idx" ON "alert_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "alerts_tenant_id_idx" ON "alerts"("tenant_id");

-- CreateIndex
CREATE INDEX "alerts_tenant_id_status_idx" ON "alerts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "alerts_entity_type_entity_id_idx" ON "alerts"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "role_permissions_role_user_type_module_action_idx" ON "role_permissions"("role", "user_type", "module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_user_type_module_action_key" ON "role_permissions"("role", "user_type", "module", "action");

-- CreateIndex
CREATE INDEX "permission_overrides_user_id_user_type_module_action_idx" ON "permission_overrides"("user_id", "user_type", "module", "action");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "tenant_versions_tenant_id_idx" ON "tenant_versions"("tenant_id");

-- CreateIndex
CREATE INDEX "user_client_holders_tenant_id_idx" ON "user_client_holders"("tenant_id");

-- CreateIndex
CREATE INDEX "user_client_holders_user_client_id_idx" ON "user_client_holders"("user_client_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_client_holders_user_client_id_holder_id_key" ON "user_client_holders"("user_client_id", "holder_id");

-- AddForeignKey
ALTER TABLE "user_clients" ADD CONSTRAINT "user_clients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_holding_id_fkey" FOREIGN KEY ("holding_id") REFERENCES "holdings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_parent_company_id_fkey" FOREIGN KEY ("parent_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_classes" ADD CONSTRAINT "brand_classes_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_history" ADD CONSTRAINT "brand_history_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_history" ADD CONSTRAINT "brand_history_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "user_promarks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_relationships" ADD CONSTRAINT "brand_relationships_brand_a_id_fkey" FOREIGN KEY ("brand_a_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_relationships" ADD CONSTRAINT "brand_relationships_brand_b_id_fkey" FOREIGN KEY ("brand_b_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holders" ADD CONSTRAINT "holders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_holders" ADD CONSTRAINT "brand_holders_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_holders" ADD CONSTRAINT "brand_holders_holder_id_fkey" FOREIGN KEY ("holder_id") REFERENCES "holders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_history" ADD CONSTRAINT "contract_history_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_brands" ADD CONSTRAINT "contract_brands_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_brands" ADD CONSTRAINT "contract_brands_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_previous_version_id_fkey" FOREIGN KEY ("previous_version_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_alert_rule_id_fkey" FOREIGN KEY ("alert_rule_id") REFERENCES "alert_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_versions" ADD CONSTRAINT "tenant_versions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_client_holders" ADD CONSTRAINT "user_client_holders_user_client_id_fkey" FOREIGN KEY ("user_client_id") REFERENCES "user_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_client_holders" ADD CONSTRAINT "user_client_holders_holder_id_fkey" FOREIGN KEY ("holder_id") REFERENCES "holders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_client_holders" ADD CONSTRAINT "user_client_holders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

