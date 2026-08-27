const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'c:/Users/toro5/Documents/AZSA/KEKALA/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: reports } = await supabase.from('external_sales_reports').select('id, report_date, branches(name)');
    const reportMap = {};
    for (const r of reports) reportMap[r.id] = r;

    // Get recipe mapping for Yogurt
    const product = 'PALETA_ORIG_YOGURT';
    const { data: prodInfo } = await supabase.from('products').select('id').eq('product_code', product).single();
    const { data: recipes } = await supabase.from('foodbot_mappings').select('foodbot_name, deduction_quantity').eq('product_id', prodInfo.id);
    
    // Valid modifier codes
    const modCodesMap = {};
    for (const r of recipes) {
        const code = 'MOD_' + r.foodbot_name.toUpperCase().replace(/[^A-Z0-9_]/g, '_').substring(0, 40);
        modCodesMap[code] = r.deduction_quantity;
    }
    const modCodes = Object.keys(modCodesMap);

    const { data: items } = await supabase.from('external_sales_report_items')
        .select('report_id, quantity_sold, source_product_name, source_product_code')
        .in('source_product_code', modCodes);

    const aggregated = {};
    for (const item of items) {
        const r = reportMap[item.report_id];
        if (!r) continue;
        const deduction = modCodesMap[item.source_product_code] * item.quantity_sold;
        const key = `${r.branches.name} | ${r.report_date}`;
        aggregated[key] = (aggregated[key] || 0) + deduction;
    }

    console.log(`\nREAL SALES FROM FOODBOT REPORTS FOR ${product}:`);
    for (const k of Object.keys(aggregated).sort()) {
        console.log(`${k}: ${aggregated[k]}`);
    }
}
check();
