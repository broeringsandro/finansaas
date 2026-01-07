
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvjevuirttobksbbtkvu.supabase.co';
const supabaseKey = 'sb_publishable_HTmry-t_9kMzp_6a2wc8Yw_PbSEU0Tt';

export const supabase = createClient(supabaseUrl, supabaseKey);
