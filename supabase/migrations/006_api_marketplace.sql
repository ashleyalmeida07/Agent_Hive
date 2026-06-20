-- ══════════════════════════════════════════════════════════════
-- AgentHive API Marketplace Schema
-- ══════════════════════════════════════════════════════════════

-- API Listings (what sellers publish)
CREATE TABLE IF NOT EXISTS api_listings (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_wallet   TEXT        NOT NULL,
    name            TEXT        NOT NULL,
    description     TEXT        NOT NULL,
    endpoint        TEXT        NOT NULL,  -- Base URL of the actual API
    price_per_call  NUMERIC     NOT NULL DEFAULT 0,  -- in MON (18 decimals stored as ether units)
    category        TEXT        NOT NULL DEFAULT 'AI/ML',
    tags            JSONB       NOT NULL DEFAULT '[]',
    example_request JSONB       DEFAULT '{}',
    example_response JSONB      DEFAULT '{}',
    status          TEXT        NOT NULL DEFAULT 'active',  -- active | paused | deleted
    total_calls     INTEGER     NOT NULL DEFAULT 0,
    total_revenue   NUMERIC     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API Purchases / Stakes
CREATE TABLE IF NOT EXISTS api_purchases (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_wallet    TEXT        NOT NULL,
    api_id          UUID        NOT NULL REFERENCES api_listings(id) ON DELETE CASCADE,
    api_key         TEXT        NOT NULL UNIQUE,  -- bearer key for gateway
    stake_amount    TEXT        NOT NULL DEFAULT '0.01',  -- in MON
    tx_hash         TEXT,
    calls_made      INTEGER     NOT NULL DEFAULT 0,
    calls_limit     INTEGER     NOT NULL DEFAULT 1000,
    status          TEXT        NOT NULL DEFAULT 'active',  -- active | withdrawn
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usage Logs (every proxied call)
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id     UUID        NOT NULL REFERENCES api_purchases(id) ON DELETE CASCADE,
    api_id          UUID        NOT NULL REFERENCES api_listings(id) ON DELETE CASCADE,
    endpoint        TEXT        NOT NULL,
    method          TEXT        NOT NULL DEFAULT 'POST',
    status_code     INTEGER,
    response_ms     INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_listings_seller     ON api_listings(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_api_listings_category   ON api_listings(category);
CREATE INDEX IF NOT EXISTS idx_api_listings_status     ON api_listings(status);
CREATE INDEX IF NOT EXISTS idx_api_listings_created    ON api_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_purchases_buyer     ON api_purchases(buyer_wallet);
CREATE INDEX IF NOT EXISTS idx_api_purchases_api       ON api_purchases(api_id);
CREATE INDEX IF NOT EXISTS idx_api_purchases_key       ON api_purchases(api_key);
CREATE INDEX IF NOT EXISTS idx_api_usage_purchase      ON api_usage_logs(purchase_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created       ON api_usage_logs(created_at DESC);

-- Full-text search index on name + description
CREATE INDEX IF NOT EXISTS idx_api_listings_fts ON api_listings
    USING GIN(to_tsvector('english', name || ' ' || description));

-- Auto updated_at trigger
CREATE OR REPLACE FUNCTION update_api_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_api_listings_updated_at ON api_listings;
CREATE TRIGGER trg_api_listings_updated_at
    BEFORE UPDATE ON api_listings
    FOR EACH ROW EXECUTE FUNCTION update_api_listings_updated_at();

-- RLS
ALTER TABLE api_listings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read listings"    ON api_listings  FOR SELECT USING (true);
CREATE POLICY "Service all listings"    ON api_listings  FOR ALL    USING (true) WITH CHECK (true);
CREATE POLICY "Service all purchases"   ON api_purchases FOR ALL    USING (true) WITH CHECK (true);
CREATE POLICY "Buyer read purchases"    ON api_purchases FOR SELECT USING (true);
CREATE POLICY "Service all usage"       ON api_usage_logs FOR ALL   USING (true) WITH CHECK (true);
CREATE POLICY "Public read usage"       ON api_usage_logs FOR SELECT USING (true);

-- Seed: demo AI/ML APIs
INSERT INTO api_listings (seller_wallet, name, description, endpoint, price_per_call, category, tags, example_request, example_response) VALUES
('0x0000000000000000000000000000000000000001',
 'Stable Diffusion XL',
 'Generate high-quality images from text prompts using SDXL. Supports negative prompts, aspect ratios, and style presets.',
 'https://api.stability.ai',
 0.002, 'Image Generation',
 '["image", "diffusion", "text-to-image"]',
 '{"prompt": "a cyberpunk bee, neon glow, 4k", "width": 1024, "height": 1024}',
 '{"image_url": "https://...", "seed": 12345}'
),
('0x0000000000000000000000000000000000000002',
 'GPT-4o Inference',
 'Access GPT-4o for fast, structured text generation and reasoning. Supports system prompts, JSON mode, and function calling.',
 'https://api.openai.com',
 0.003, 'NLP',
 '["gpt", "llm", "text-generation", "reasoning"]',
 '{"model": "gpt-4o", "messages": [{"role": "user", "content": "Hello"}]}',
 '{"choices": [{"message": {"content": "Hello! How can I help?"}}]}'
),
('0x0000000000000000000000000000000000000001',
 'Whisper Speech-to-Text',
 'Convert audio to text with OpenAI Whisper. Supports 50+ languages, timestamps, and word-level confidence.',
 'https://api.openai.com',
 0.001, 'Audio',
 '["whisper", "speech", "transcription", "audio"]',
 '{"audio_url": "https://...", "language": "en"}',
 '{"text": "Hello world", "language": "en", "duration": 2.3}'
),
('0x0000000000000000000000000000000000000003',
 'Code Llama 70B',
 'Open-source code completion and generation using Code Llama 70B. Supports 20+ languages with fill-in-the-middle.',
 'https://api.together.ai',
 0.001, 'Code',
 '["code", "llm", "completion", "codegen"]',
 '{"prompt": "def fibonacci(n):", "max_tokens": 256}',
 '{"output": "    if n <= 1:\\n        return n\\n    return fibonacci(n-1) + fibonacci(n-2)"}'
);
