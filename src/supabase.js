import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lwinvwocxtstvyhkicpv.supabase.co";
const supabaseKey = "sb_publishable_-aKK1zDOzEd0sQTymO1a4Q_aFR8tvb9";

export const supabase = createClient(supabaseUrl, supabaseKey);