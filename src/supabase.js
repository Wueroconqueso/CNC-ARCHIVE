import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://lwinvwocxtstvyhkicpv.supabase.co";
export const SUPABASE_KEY = "sb_publishable_-aKK1zDOzEd0sQTymO1a4Q_aFR8tvb9";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);