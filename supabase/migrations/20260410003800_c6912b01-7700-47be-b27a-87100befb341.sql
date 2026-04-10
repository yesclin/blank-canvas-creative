-- Force PostgREST schema cache reload so it picks up the specialty_id column on procedures
NOTIFY pgrst, 'reload schema';
