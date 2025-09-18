-- Analytics materialized view refresh function
CREATE OR REPLACE FUNCTION refresh_materialized_view(view_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Admin kontrolü
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Güvenlik: Sadece belirli view'ları yenilemeye izin ver
  IF view_name NOT IN (
    'collection_aggregates',
    'top_whiskies_by_collection',
    'trends_collection_daily',
    'taste_and_rating_stats_by_segment',
    'notes_basic_stats'
  ) THEN
    RAISE EXCEPTION 'Invalid view name: %', view_name;
  END IF;

  -- Materialized view'ı yenile
  EXECUTE format('REFRESH MATERIALIZED VIEW %I', view_name);

  -- Log işlemi
  INSERT INTO analytics_refresh_log (
    view_name,
    refreshed_at,
    refreshed_by
  ) VALUES (
    view_name,
    NOW(),
    auth.uid()
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Hata durumunda log
    INSERT INTO analytics_refresh_log (
      view_name,
      refreshed_at,
      refreshed_by,
      error_message
    ) VALUES (
      view_name,
      NOW(),
      auth.uid(),
      SQLERRM
    );
    RAISE;
END;
$$;

-- Analytics refresh log tablosu
CREATE TABLE IF NOT EXISTS analytics_refresh_log (
  id BIGSERIAL PRIMARY KEY,
  view_name TEXT NOT NULL,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refreshed_by UUID REFERENCES profiles(id),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log tablosu için RLS
ALTER TABLE analytics_refresh_log ENABLE ROW LEVEL SECURITY;

-- Sadece adminler log görebilir
CREATE POLICY "Admins can view refresh logs" ON analytics_refresh_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Sistem log ekleyebilir
CREATE POLICY "System can insert refresh logs" ON analytics_refresh_log
  FOR INSERT
  WITH CHECK (true);

-- Cron job için schedule tablosu
CREATE TABLE IF NOT EXISTS analytics_schedule (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL UNIQUE,
  schedule_expression TEXT NOT NULL, -- cron format
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schedule için default job
INSERT INTO analytics_schedule (job_name, schedule_expression, enabled)
VALUES ('refresh_analytics', '0 */5 * * * *', true) -- Her 5 dakikada
ON CONFLICT (job_name) DO NOTHING;

-- RLS for schedule
ALTER TABLE analytics_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedules" ON analytics_schedule
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Batch refresh function (tüm view'ları yeniler)
CREATE OR REPLACE FUNCTION refresh_all_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  view_names text[] := ARRAY[
    'collection_aggregates',
    'top_whiskies_by_collection',
    'trends_collection_daily',
    'taste_and_rating_stats_by_segment',
    'notes_basic_stats'
  ];
  view_name text;
  success_count int := 0;
  error_count int := 0;
  results json[];
  result json;
BEGIN
  -- Admin kontrolü
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  FOREACH view_name IN ARRAY view_names LOOP
    BEGIN
      PERFORM refresh_materialized_view(view_name);
      success_count := success_count + 1;
      results := results || json_build_object(
        'view', view_name,
        'success', true,
        'refreshed_at', NOW()
      );
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
        results := results || json_build_object(
          'view', view_name,
          'success', false,
          'error', SQLERRM
        );
    END;
  END LOOP;

  RETURN json_build_object(
    'success_count', success_count,
    'error_count', error_count,
    'total_count', array_length(view_names, 1),
    'results', array_to_json(results),
    'completed_at', NOW()
  );
END;
$$;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_analytics_refresh_log_view_name ON analytics_refresh_log(view_name);
CREATE INDEX IF NOT EXISTS idx_analytics_refresh_log_refreshed_at ON analytics_refresh_log(refreshed_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_schedule_enabled ON analytics_schedule(enabled) WHERE enabled = true;