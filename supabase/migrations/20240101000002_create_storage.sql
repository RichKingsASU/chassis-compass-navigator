-- ============================================================================
-- Migration: Create storage buckets and policies
-- Description: Storage configuration for all file upload buckets
-- ============================================================================

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Public bucket for general invoice access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoices', 'invoices', true, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Private bucket for invoice files with 50MB limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-files', 'invoice-files', false, 52428800,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]::TEXT[]
)
ON CONFLICT (id) DO NOTHING;

-- Vendor-specific invoice buckets (private, 20MB, PDF/Excel)
DO $$
DECLARE
  bucket TEXT;
BEGIN
  FOR bucket IN
    SELECT unnest(ARRAY[
      'dcli-invoices',
      'ccm-invoices',
      'trac-invoices',
      'flexivan-invoices',
      'wccp-invoices',
      'scspa-invoices'
    ])
  LOOP
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      bucket, bucket, false, 20971520,
      ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ]::TEXT[]
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;

-- GPS provider buckets (private, no size/type restrictions)
DO $$
DECLARE
  bucket TEXT;
BEGIN
  FOR bucket IN
    SELECT unnest(ARRAY[
      'gps-samsara',
      'gps-anytrek',
      'gps-fleetview',
      'gps-fleetlocate',
      'gps-blackberry'
    ])
  LOOP
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (bucket, bucket, false, NULL, NULL)
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;

-- Yard management buckets (private)
DO $$
DECLARE
  bucket TEXT;
BEGIN
  FOR bucket IN
    SELECT unnest(ARRAY[
      'yard-jed',
      'yard-pola'
    ])
  LOOP
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (bucket, bucket, false, NULL, NULL)
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;

-- ============================================================================
-- STORAGE POLICIES: Permissive access for authenticated users on all buckets
-- ============================================================================

DO $$
DECLARE
  bucket TEXT;
BEGIN
  FOR bucket IN
    SELECT unnest(ARRAY[
      'invoices',
      'invoice-files',
      'dcli-invoices',
      'ccm-invoices',
      'trac-invoices',
      'flexivan-invoices',
      'wccp-invoices',
      'scspa-invoices',
      'gps-samsara',
      'gps-anytrek',
      'gps-fleetview',
      'gps-fleetlocate',
      'gps-blackberry',
      'yard-jed',
      'yard-pola'
    ])
  LOOP
    -- SELECT (download) policy
    EXECUTE format(
      'DROP POLICY IF EXISTS "Authenticated users can read %s" ON storage.objects;', bucket
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated users can read %s" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = %L);',
      bucket, bucket
    );

    -- INSERT (upload) policy
    EXECUTE format(
      'DROP POLICY IF EXISTS "Authenticated users can upload %s" ON storage.objects;', bucket
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated users can upload %s" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L);',
      bucket, bucket
    );

    -- UPDATE policy
    EXECUTE format(
      'DROP POLICY IF EXISTS "Authenticated users can update %s" ON storage.objects;', bucket
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated users can update %s" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %L);',
      bucket, bucket
    );

    -- DELETE policy
    EXECUTE format(
      'DROP POLICY IF EXISTS "Authenticated users can delete %s" ON storage.objects;', bucket
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated users can delete %s" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L);',
      bucket, bucket
    );
  END LOOP;
END;
$$;
