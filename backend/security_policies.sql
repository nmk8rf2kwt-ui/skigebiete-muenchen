-- 1. Enable Row Level Security (RLS) on tables
-- This blocks all access by default for 'anon' public users, except where policies exist.
ALTER TABLE resort_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_logs ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy: Allow Public Read Access
-- Everyone (anon) can SEE the data (needed for the frontend charts)
CREATE POLICY "Public Read Access Snapshots"
ON resort_snapshots
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public Read Access Traffic"
ON traffic_logs
FOR SELECT
TO anon
USING (true);

-- 3. (Implicit) Service Role Access
-- The 'service_role' key (which your backend now uses) automatically bypasses RLS.
-- No specific policy is needed for it to Insert/Update/Delete.
