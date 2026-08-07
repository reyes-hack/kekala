BEGIN;

------------------------------------------------------------------
-- INSERT
------------------------------------------------------------------

CREATE POLICY "Authenticated users can upload evidence"

ON storage.objects

FOR INSERT

TO authenticated

WITH CHECK (

    bucket_id='evidence'

);

------------------------------------------------------------------
-- SELECT
------------------------------------------------------------------

CREATE POLICY "Public can view evidence"

ON storage.objects

FOR SELECT

USING (

    bucket_id='evidence'

);

COMMIT;