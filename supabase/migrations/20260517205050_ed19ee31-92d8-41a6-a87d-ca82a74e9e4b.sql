
-- ===========================================================
-- Hardening SECURITY DEFINER functions (schema public)
-- ===========================================================
-- Estratégia:
--   1) REVOKE EXECUTE FROM anon em todas que não sirvam o fluxo público
--   2) REVOKE EXECUTE FROM authenticated APENAS nas 4 funções internas
--      (helpers de RLS e funções chamadas por usuários logados são preservadas)
-- ===========================================================

-- ---------- Grupo B: helpers de RLS (revogar anon) ----------
REVOKE EXECUTE ON FUNCTION public.can_access_clinic_as_staff(uuid)                                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_access_clinical_content(uuid)                                 FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_access_teleconsultation_session_row(uuid, uuid)               FROM anon;
REVOKE EXECUTE ON FUNCTION public.clinic_can_mutate(uuid)                                           FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_professional_id_for_clinic(uuid)                          FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role_for_clinic(uuid)                                FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_plan_limit(uuid, text)                                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_clinic_id()                                                FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_clinic_id_for_rls()                                      FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)                                          FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_clinic_admin(uuid, uuid)                                       FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid)                                           FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_platform_super_admin(uuid)                                     FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_recepcionista(uuid)                                            FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_clinic_id(uuid)                                              FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_has_module_permission(uuid, app_module, app_action)          FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_professional_id(uuid)                                        FROM anon;

-- ---------- Grupo C: callable por authenticated (revogar anon) ----------
REVOKE EXECUTE ON FUNCTION public.claim_first_platform_admin(text)                                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.clinic_specialty_summary(uuid)                                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.count_active_super_admins()                                       FROM anon;
REVOKE EXECUTE ON FUNCTION public.count_platform_admins()                                           FROM anon;
REVOKE EXECUTE ON FUNCTION public.deactivate_specialty(uuid, text)                                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_overdue_trials()                                           FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_quote_number(uuid)                                       FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_teleconsultation_token(uuid, text, text, integer)        FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_channel_integration_credentials(uuid)                         FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_next_document_number(uuid)                                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_all_permissions(uuid)                                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_teleconsultation_event(uuid, uuid, text, text, uuid, text, uuid, uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.provision_estetica_anamnesis_templates(uuid, uuid)                FROM anon;
REVOKE EXECUTE ON FUNCTION public.provision_fisioterapia_anamnesis_templates(uuid, uuid)            FROM anon;
REVOKE EXECUTE ON FUNCTION public.provision_nutricao_anamnesis_templates(uuid, uuid)                FROM anon;
REVOKE EXECUTE ON FUNCTION public.provision_pilates_anamnesis_templates(uuid, uuid)                 FROM anon;
REVOKE EXECUTE ON FUNCTION public.provision_psicologia_anamnesis_templates(uuid, uuid)              FROM anon;
REVOKE EXECUTE ON FUNCTION public.provision_specialty(uuid, text)                                   FROM anon;
REVOKE EXECUTE ON FUNCTION public.request_subscription(text)                                        FROM anon;
REVOKE EXECUTE ON FUNCTION public.reset_anamnesis_templates(uuid, uuid)                             FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_appointment_teleconsultation_status(uuid)                    FROM anon;

-- ---------- Grupo D: apenas service_role (revogar anon E authenticated) ----------
REVOKE EXECUTE ON FUNCTION public.ensure_system_templates_integrity()       FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_platform_occurrence_code()       FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_support_ticket_code()            FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_default_payment_methods(uuid)        FROM anon, authenticated;

-- ---------- Grupo A: garantir EXECUTE para anon nas funções públicas ----------
GRANT EXECUTE ON FUNCTION public.validate_clinical_document(text)                                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_teleconsultation_token(text, text)                        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_join_teleconsultation(uuid, text)                              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(uuid, uuid, date, date)                           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_professionals(uuid, uuid)                               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_slot_available(uuid, uuid, date, time, time)                 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_or_create_public_patient(uuid, text, text, text, text, date)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_pre_registration_by_token(text)                                TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_pre_registration(text, jsonb)                               TO anon, authenticated;
