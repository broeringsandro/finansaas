
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvjevuirttobksbbtkvu.supabase.co';
const supabaseKey = 'sb_publishable_HTmry-t_9kMzp_6a2wc8Yw_PbSEU0Tt';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const checkAuthError = async (error: any) => {
    if (!error) return;

    const msg = error.message || error.error_description || '';
    if (
        msg.match(/Invalid Refresh Token|JWT expired/i) ||
        error.status === 401 ||
        error.statusCode === 401
    ) {
        console.warn("Session expired or invalid token. Signing out...");
        await supabase.auth.signOut();
        window.location.href = '/login';
    }
};
