import { supabase } from './infrastructure/database/supabaseClient';

async function run() {
    const { data: status } = await supabase.from('catalog_values').select('id, name, code').eq('category', 'SALE_STATUS');
    const { data: profile } = await supabase.from('profiles').select('id').limit(1);
    const { data: paymentMethods } = await supabase.from('catalog_values').select('id, name, code').eq('category', 'PAYMENT_METHOD');

    console.log('Statuses:', status);
    console.log('Profile:', profile);
    console.log('Payment Methods:', paymentMethods);
}

run();
