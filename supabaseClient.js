
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://uqkjceuszccqkyypabxz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_LmUpuyQXV-mwThRZ2RZkvw__ytGS3rs";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
