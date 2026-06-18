// Re-exports the shared Supabase client so code importing from "@/utils/supabase"
// or "../utils/supabase" resolves to the same singleton as the rest of the app.
export { supabase } from "@/integrations/supabase/client";
