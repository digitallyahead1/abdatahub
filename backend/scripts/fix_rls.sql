-- =============================================================
-- SUPABASE SECURITY FIX
-- Enables RLS on all public tables and removes all anon/authenticated
-- Data API access. The NestJS backend uses the service_role / postgres
-- connection which bypasses RLS, so no legitimate traffic is affected.
-- All 21 tables are locked down.
-- =============================================================

-- ─── 1. ENABLE ROW-LEVEL SECURITY ON EVERY TABLE ─────────────
ALTER TABLE public."user"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transaction        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airtime_pricing           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airtime_transaction       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_plan                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_transaction          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_token              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_category             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_pin                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gafiapay_virtual_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_key           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_otp        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_setting            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_virtual_accounts     ENABLE ROW LEVEL SECURITY;

-- ─── 2. REVOKE ALL DATA API ACCESS FROM anon AND authenticated ─
-- Our backend connects as postgres/service_role (bypassrls=true),
-- so these roles are never used by any legitimate code path.
-- Revoking prevents direct Supabase Data API access entirely.

REVOKE ALL ON public."user"                    FROM anon, authenticated;
REVOKE ALL ON public.wallet                    FROM anon, authenticated;
REVOKE ALL ON public.transaction               FROM anon, authenticated;
REVOKE ALL ON public.wallet_transaction        FROM anon, authenticated;
REVOKE ALL ON public.airtime_pricing           FROM anon, authenticated;
REVOKE ALL ON public.airtime_transaction       FROM anon, authenticated;
REVOKE ALL ON public.api_key                   FROM anon, authenticated;
REVOKE ALL ON public.api_request_log           FROM anon, authenticated;
REVOKE ALL ON public.audit_log                 FROM anon, authenticated;
REVOKE ALL ON public.data_plan                 FROM anon, authenticated;
REVOKE ALL ON public.data_transaction          FROM anon, authenticated;
REVOKE ALL ON public.device_token              FROM anon, authenticated;
REVOKE ALL ON public.exam_category             FROM anon, authenticated;
REVOKE ALL ON public.exam_pin                  FROM anon, authenticated;
REVOKE ALL ON public.gafiapay_virtual_accounts FROM anon, authenticated;
REVOKE ALL ON public.idempotency_key           FROM anon, authenticated;
REVOKE ALL ON public.password_reset_otp        FROM anon, authenticated;
REVOKE ALL ON public.push_notification_log     FROM anon, authenticated;
REVOKE ALL ON public.sync_log                  FROM anon, authenticated;
REVOKE ALL ON public.system_setting            FROM anon, authenticated;
REVOKE ALL ON public.user_virtual_accounts     FROM anon, authenticated;

-- ─── 3. EXPLICIT DENY-ALL RLS POLICIES (defense-in-depth) ─────
-- Even if someone re-grants table access later, these policies
-- ensure anon/authenticated roles can never see any rows.

-- user table (most sensitive: passwords, PII)
CREATE POLICY "deny_all_anon" ON public."user"
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public."user"
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- wallet (financial data)
CREATE POLICY "deny_all_anon" ON public.wallet
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.wallet
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- transaction (financial records)
CREATE POLICY "deny_all_anon" ON public.transaction
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.transaction
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- wallet_transaction (ledger)
CREATE POLICY "deny_all_anon" ON public.wallet_transaction
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.wallet_transaction
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- password_reset_otp (highly sensitive)
CREATE POLICY "deny_all_anon" ON public.password_reset_otp
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.password_reset_otp
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- api_key (secrets)
CREATE POLICY "deny_all_anon" ON public.api_key
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.api_key
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- api_request_log
CREATE POLICY "deny_all_anon" ON public.api_request_log
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.api_request_log
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- audit_log
CREATE POLICY "deny_all_anon" ON public.audit_log
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.audit_log
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- airtime_pricing
CREATE POLICY "deny_all_anon" ON public.airtime_pricing
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.airtime_pricing
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- airtime_transaction
CREATE POLICY "deny_all_anon" ON public.airtime_transaction
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.airtime_transaction
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- data_plan
CREATE POLICY "deny_all_anon" ON public.data_plan
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.data_plan
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- data_transaction
CREATE POLICY "deny_all_anon" ON public.data_transaction
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.data_transaction
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- device_token
CREATE POLICY "deny_all_anon" ON public.device_token
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.device_token
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- exam_category
CREATE POLICY "deny_all_anon" ON public.exam_category
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.exam_category
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- exam_pin
CREATE POLICY "deny_all_anon" ON public.exam_pin
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.exam_pin
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- gafiapay_virtual_accounts
CREATE POLICY "deny_all_anon" ON public.gafiapay_virtual_accounts
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.gafiapay_virtual_accounts
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- idempotency_key
CREATE POLICY "deny_all_anon" ON public.idempotency_key
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.idempotency_key
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- push_notification_log
CREATE POLICY "deny_all_anon" ON public.push_notification_log
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.push_notification_log
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- sync_log
CREATE POLICY "deny_all_anon" ON public.sync_log
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.sync_log
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- system_setting
CREATE POLICY "deny_all_anon" ON public.system_setting
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.system_setting
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- user_virtual_accounts
CREATE POLICY "deny_all_anon" ON public.user_virtual_accounts
  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON public.user_virtual_accounts
  AS RESTRICTIVE FOR ALL TO authenticated USING (false);
