BEGIN;

------------------------------------------------------------------
-- EXPENSE_ESTABLISHMENT
------------------------------------------------------------------

INSERT INTO public.catalog_types (
    code,
    name,
    description
)
VALUES (
    'EXPENSE_ESTABLISHMENT',
    'Establecimientos',
    'Establecimientos donde se realizan gastos operativos.'
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.catalog_values (
    catalog_type_id,
    code,
    name,
    sort_order,
    color,
    icon,
    is_active
)
SELECT
    ct.id,
    v.code,
    v.name,
    v.sort_order,
    v.color,
    v.icon,
    TRUE
FROM public.catalog_types ct
CROSS JOIN (

    VALUES

    ('OXXO','OXXO',10,'red','store'),

    ('COSTCO','Costco',20,'blue','warehouse'),

    ('OFFICE_DEPOT','Office Depot',30,'orange','office'),

    ('WALMART','Walmart',40,'blue','shopping_cart'),

    ('HOME_DEPOT','Home Depot',50,'orange','construction'),

    ('SAMS_CLUB','Sam''s Club',60,'blue','warehouse'),

    ('AMAZON','Amazon',70,'black','shopping'),

    ('MERCADO_LIBRE','Mercado Libre',80,'yellow','shopping'),

    ('CFE','CFE',90,'green','bolt'),

    ('TELMEX','Telmex',100,'blue','phone'),

    ('OTRO','Otro',110,'gray','category')

) AS v(
    code,
    name,
    sort_order,
    color,
    icon
)
WHERE ct.code='EXPENSE_ESTABLISHMENT'
ON CONFLICT DO NOTHING;

COMMIT;