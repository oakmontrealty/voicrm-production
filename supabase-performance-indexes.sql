-- Performance Optimization: Database Indexes for VoiCRM
-- These indexes will dramatically improve search and query performance

-- Index for searching contacts by name (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_contacts_name_lower ON contacts (LOWER(name));

-- Index for searching by email
CREATE INDEX IF NOT EXISTS idx_contacts_email_lower ON contacts (LOWER(email));

-- Index for searching by phone number
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts (phone_number);

-- Index for searching by company
CREATE INDEX IF NOT EXISTS idx_contacts_company_lower ON contacts (LOWER(company));

-- Composite index for status filtering
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts (status);

-- Index for needs_attention flag
CREATE INDEX IF NOT EXISTS idx_contacts_needs_attention ON contacts (needs_attention) WHERE needs_attention = true;

-- Index for created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts (created_at DESC);

-- Index for lead_score (for sorting high-value leads)
CREATE INDEX IF NOT EXISTS idx_contacts_lead_score ON contacts (lead_score DESC) WHERE lead_score IS NOT NULL;

-- Composite index for common queries (status + created_at)
CREATE INDEX IF NOT EXISTS idx_contacts_status_created ON contacts (status, created_at DESC);

-- Index for Pipedrive ID lookups
CREATE INDEX IF NOT EXISTS idx_contacts_pipedrive_id ON contacts (pipedrive_id) WHERE pipedrive_id IS NOT NULL;

-- Full text search index for better search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_email_trgm ON contacts USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_company_trgm ON contacts USING gin (company gin_trgm_ops);

-- Analyze tables to update statistics
ANALYZE contacts;

-- View to check index usage
CREATE OR REPLACE VIEW index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;