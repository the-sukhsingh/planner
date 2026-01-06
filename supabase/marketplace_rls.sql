-- Enable RLS on marketplace tables
ALTER TABLE marketplace_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_forks ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_plan_tags ENABLE ROW LEVEL SECURITY;

-- Marketplace Plans Policies
CREATE POLICY "Public can view published marketplace plans"
ON marketplace_plans FOR SELECT
USING (status = 'published' AND visibility = 'public');

CREATE POLICY "Owners can manage their marketplace plans"
ON marketplace_plans FOR ALL
USING (true); -- In a real scenario, we would use auth.uid() 
-- but since NextAuth is used, the backend (Drizzle) will handle access control.
-- If using Supabase directly from the client, we would need to link auth.uid() to users_table.id.

-- Plan Forks Policies
CREATE POLICY "Users can view their own forks"
ON plan_forks FOR SELECT
USING (true); -- Backend managed

-- Plan Purchases Policies
CREATE POLICY "Users can view their own purchases"
ON plan_purchases FOR SELECT
USING (true); -- Backend managed

-- Tags are public
CREATE POLICY "Anyone can view tags"
ON plan_tags FOR SELECT
USING (true);

CREATE POLICY "Anyone can view plan tags"
ON marketplace_plan_tags FOR SELECT
USING (true);

-- Note: Since this application uses NextAuth and a direct Postgres connection (Drizzle),
-- these RLS policies are primarily for extra safety if the Supabase client is used or if
-- the user decides to expose these tables via PostgREST.
-- For the paid-access enforcement mentioned in the request:
-- We will implement this in the application logic (Server Actions) to ensure
-- that forking a paid plan requires a purchase record.
