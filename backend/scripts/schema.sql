-- Recommended Database Optimizations

-- 1. Optimizing Traffic Log Analysis
-- Create a composite index on resort_id and timestamp to speed up trafficAnalysis.js queries
-- which filter by resort_id and range query on timestamp.
CREATE INDEX IF NOT EXISTS idx_traffic_logs_resort_timestamp 
ON traffic_logs (resort_id, timestamp);

-- 2. Ensure resort_id is indexed (usually implicit with foreign key, but good to be explicit for filtering)
CREATE INDEX IF NOT EXISTS idx_traffic_logs_resort_id 
ON traffic_logs (resort_id);

-- 3. Index for timestamp for cleanup jobs (delete old logs)
CREATE INDEX IF NOT EXISTS idx_traffic_logs_timestamp 
ON traffic_logs (timestamp);
