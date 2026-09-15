CREATE OR REPLACE FUNCTION public.submit_feedback(
  p_category text,
  p_message text,
  p_author_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_recent_count bigint;
  v_global_rate bigint;
BEGIN
  IF v_user_id IS NOT NULL THEN
    SELECT count(*) INTO v_recent_count
    FROM public.feedback
    WHERE user_id = v_user_id
      AND created_at > now() - interval '24 hours';

    IF v_recent_count >= 10 THEN
      RAISE EXCEPTION 'Troppe segnalazioni oggi. Riprova domani.';
    END IF;
  END IF;

  SELECT count(*) INTO v_global_rate
  FROM public.feedback
  WHERE created_at > now() - interval '1 minute';

  IF v_global_rate >= 20 THEN
    RAISE EXCEPTION 'Troppe segnalazioni in poco tempo. Riprova tra qualche minuto.';
  END IF;

  INSERT INTO public.feedback(category, message, author_name, user_id)
  VALUES (p_category, p_message, p_author_name, v_user_id);
END;
$function$;
;

GRANT EXECUTE ON FUNCTION public.submit_feedback(text, text, text) TO anon, authenticated;
