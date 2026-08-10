-- ============================================================
-- 001-get-income-statement.sql
-- Estado de Resultados / P&L por sucursal
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_income_statement(
    p_branch_uuid UUID,
    p_target_month INTEGER,
    p_target_year INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_period_start DATE;
    v_period_end DATE;
    v_period TEXT;

    v_organization_id UUID;

    -- Ventas
    v_gross_sales NUMERIC := 0;
    v_discounts NUMERIC := 0;
    v_net_sales NUMERIC := 0;

    -- Métodos de pago
    v_cash_sales NUMERIC := 0;
    v_card_sales NUMERIC := 0;
    v_transfer_sales NUMERIC := 0;
    v_digital_wallet_sales NUMERIC := 0;

    -- COGS
    v_cogs NUMERIC := 0;

    -- OPEX
    v_expenses_total NUMERIC := 0;
    v_fixed_costs_total NUMERIC := 0;
    v_operating_expenses NUMERIC := 0;

    -- Finanzas
    v_card_commission_percentage NUMERIC := 2.5;
    v_financial_expenses NUMERIC := 0;

    -- Resultados
    v_gross_profit NUMERIC := 0;
    v_operating_profit NUMERIC := 0;
    v_net_profit NUMERIC := 0;

    -- JSON
    v_cogs_breakdown JSONB := '[]'::JSONB;
    v_operating_breakdown JSONB := '[]'::JSONB;
    v_financial_breakdown JSONB := '[]'::JSONB;

BEGIN

    -- ========================================================
    -- 1. VALIDACIÓN DE PARÁMETROS
    -- ========================================================

    IF p_branch_uuid IS NULL THEN
        RAISE EXCEPTION
            'INVALID_BRANCH: branch_uuid es obligatorio.';
    END IF;

    IF p_target_month IS NULL
       OR p_target_month < 1
       OR p_target_month > 12 THEN
        RAISE EXCEPTION
            'INVALID_MONTH: target_month debe estar entre 1 y 12.';
    END IF;

    IF p_target_year IS NULL
       OR p_target_year < 2000
       OR p_target_year > 2100 THEN
        RAISE EXCEPTION
            'INVALID_YEAR: target_year no es válido.';
    END IF;


    -- ========================================================
    -- 2. DEFINIR PERIODO
    -- ========================================================

    v_period_start := make_date(
        p_target_year,
        p_target_month,
        1
    );

    v_period_end := (
        v_period_start + INTERVAL '1 month'
    )::DATE;

    v_period := to_char(
        v_period_start,
        'YYYY-MM'
    );


    -- ========================================================
    -- 3. OBTENER ORGANIZACIÓN DE LA SUCURSAL
    -- ========================================================

    SELECT b.organization_id
    INTO v_organization_id
    FROM public.branches b
    WHERE b.id = p_branch_uuid
    LIMIT 1;

    IF v_organization_id IS NULL THEN
        RAISE EXCEPTION
            'BRANCH_NOT_FOUND: La sucursal indicada no existe.';
    END IF;


    -- ========================================================
    -- 4. AUTORIZACIÓN
    -- ========================================================
    --
    -- ADMIN:
    --   Puede consultar cualquier sucursal.
    --
    -- CASHIER:
    --   Solo puede consultar su organización y sucursal.
    --
    -- ========================================================

    IF NOT public.is_jwt_admin() THEN

        IF NOT public.has_jwt_role('CASHIER') THEN
            RAISE EXCEPTION
                'FORBIDDEN: El usuario no tiene un rol autorizado para consultar el Estado de Resultados.';
        END IF;

        IF NOT public.is_same_org_and_branch(
            v_organization_id,
            p_branch_uuid
        ) THEN
            RAISE EXCEPTION
                'FORBIDDEN_BRANCH: El usuario no tiene acceso a esta sucursal.';
        END IF;

    END IF;


    -- ========================================================
    -- 5. VENTAS
    -- ========================================================
    --
    -- Venta bruta:
    --   subtotal
    --
    -- Descuentos:
    --   discount_amount
    --
    -- Venta neta:
    --   subtotal - descuentos
    --
    -- ========================================================

    SELECT
        COALESCE(SUM(s.subtotal), 0),
        COALESCE(SUM(s.discount_amount), 0)
    INTO
        v_gross_sales,
        v_discounts
    FROM public.sales s
    WHERE s.branch_id = p_branch_uuid
      AND s.created_at >= v_period_start
      AND s.created_at < v_period_end;

    v_net_sales :=
        GREATEST(
            v_gross_sales - v_discounts,
            0
        );


    -- ========================================================
    -- 6. VENTAS POR MÉTODO DE PAGO
    -- ========================================================

    SELECT
        COALESCE(
            SUM(
                CASE
                    WHEN cv.code = 'CASH'
                    THEN p.amount
                    ELSE 0
                END
            ),
            0
        ),

        COALESCE(
            SUM(
                CASE
                    WHEN cv.code = 'CARD'
                    THEN p.amount
                    ELSE 0
                END
            ),
            0
        ),

        COALESCE(
            SUM(
                CASE
                    WHEN cv.code = 'TRANSFER'
                    THEN p.amount
                    ELSE 0
                END
            ),
            0
        ),

        COALESCE(
            SUM(
                CASE
                    WHEN cv.code = 'DIGITAL_WALLET'
                    THEN p.amount
                    ELSE 0
                END
            ),
            0
        )

    INTO
        v_cash_sales,
        v_card_sales,
        v_transfer_sales,
        v_digital_wallet_sales

    FROM public.payments p

    INNER JOIN public.sales s
        ON s.id = p.sale_id

    LEFT JOIN public.catalog_values cv
        ON cv.id = p.payment_method_id

    WHERE s.branch_id = p_branch_uuid
      AND s.created_at >= v_period_start
      AND s.created_at < v_period_end;


    -- ========================================================
    -- 7. COGS / COSTO DE VENTAS
    -- ========================================================
    --
    -- Solo órdenes ENTREGADA.
    --
    -- El importe contable proviene de:
    --
    -- purchase_order_items.total_amount
    --
    -- No utilizamos purchase_orders.order_data para dinero.
    --
    -- ========================================================

    SELECT
        COALESCE(
            SUM(poi.total_amount),
            0
        )
    INTO v_cogs

    FROM public.purchase_order_items poi

    INNER JOIN public.purchase_orders po
        ON po.id = poi.purchase_order_id

    WHERE po.branch_id = p_branch_uuid
      AND po.status = 'ENTREGADA'
      AND po.updated_at >= v_period_start
      AND po.updated_at < v_period_end;


    -- ========================================================
    -- 8. BREAKDOWN DE COGS
    -- ========================================================

    SELECT
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'purchase_order_id',
                    po.id,

                    'concept',
                    'Pedido ' || LEFT(po.id::TEXT, 8),

                    'amount',
                    order_total.amount
                )
                ORDER BY po.updated_at
            ),
            '[]'::JSONB
        )

    INTO v_cogs_breakdown

    FROM (
        SELECT
            po.id,
            po.updated_at,
            SUM(poi.total_amount) AS amount
        FROM public.purchase_orders po

        INNER JOIN public.purchase_order_items poi
            ON poi.purchase_order_id = po.id

        WHERE po.branch_id = p_branch_uuid
          AND po.status = 'ENTREGADA'
          AND po.updated_at >= v_period_start
          AND po.updated_at < v_period_end

        GROUP BY
            po.id,
            po.updated_at
    ) order_total

    INNER JOIN public.purchase_orders po
        ON po.id = order_total.id;


    -- ========================================================
    -- 9. GASTOS OPERATIVOS
    -- ========================================================

    SELECT
        COALESCE(SUM(e.amount), 0)
    INTO v_expenses_total

    FROM public.expenses e

    WHERE e.branch_id = p_branch_uuid
      AND e.date >= v_period_start
      AND e.date < v_period_end;


    -- ========================================================
    -- 10. COSTOS FIJOS
    -- ========================================================
    --
    -- month_year es DATE.
    --
    -- Se consideran los costos cuyo mes corresponde al periodo.
    --
    -- ========================================================

    SELECT
        COALESCE(SUM(bfc.amount), 0)
    INTO v_fixed_costs_total

    FROM public.branch_fixed_costs bfc

    WHERE bfc.branch_id = p_branch_uuid
      AND bfc.month_year >= v_period_start
      AND bfc.month_year < v_period_end;


    -- ========================================================
    -- 11. OPEX TOTAL
    -- ========================================================

    v_operating_expenses :=
        COALESCE(v_expenses_total, 0)
        +
        COALESCE(v_fixed_costs_total, 0);


    -- ========================================================
    -- 12. BREAKDOWN DE OPEX
    -- ========================================================

    WITH expense_breakdown AS (

        SELECT
            e.category,
            SUM(e.amount) AS amount

        FROM public.expenses e

        WHERE e.branch_id = p_branch_uuid
          AND e.date >= v_period_start
          AND e.date < v_period_end

        GROUP BY e.category
    ),

    fixed_breakdown AS (

        SELECT
            bfc.category,
            SUM(bfc.amount) AS amount

        FROM public.branch_fixed_costs bfc

        WHERE bfc.branch_id = p_branch_uuid
          AND bfc.month_year >= v_period_start
          AND bfc.month_year < v_period_end

        GROUP BY bfc.category
    ),

    combined AS (

        SELECT
            category,
            SUM(amount) AS amount

        FROM (
            SELECT * FROM expense_breakdown
            UNION ALL
            SELECT * FROM fixed_breakdown
        ) x

        GROUP BY category
    )

    SELECT
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'category',
                    category,

                    'amount',
                    amount
                )
                ORDER BY category
            ),
            '[]'::JSONB
        )

    INTO v_operating_breakdown

    FROM combined;


    -- ========================================================
    -- 13. COMISIÓN DE TARJETA
    -- ========================================================
    --
    -- Usa la configuración de la sucursal.
    --
    -- Si no existe configuración:
    --     2.5%
    --
    -- ========================================================

    SELECT
        COALESCE(
            bs.card_commission_percentage,
            2.5
        )

    INTO v_card_commission_percentage

    FROM public.branch_settings bs

    WHERE bs.branch_id = p_branch_uuid

    LIMIT 1;

    v_card_commission_percentage :=
        COALESCE(
            v_card_commission_percentage,
            2.5
        );


    -- ========================================================
    -- 14. GASTOS FINANCIEROS
    -- ========================================================

    v_financial_expenses :=
        ROUND(
            (
                COALESCE(v_card_sales, 0)
                *
                v_card_commission_percentage
                / 100
            ),
            2
        );


    v_financial_breakdown :=
        jsonb_build_array(
            jsonb_build_object(
                'category',
                'Comisiones Bancarias',

                'amount',
                v_financial_expenses,

                'rate',
                v_card_commission_percentage,

                'card_sales',
                v_card_sales
            )
        );


    -- ========================================================
    -- 15. UTILIDAD BRUTA
    -- ========================================================

    v_gross_profit :=
        v_net_sales - v_cogs;


    -- ========================================================
    -- 16. UTILIDAD OPERATIVA / EBIT
    -- ========================================================

    v_operating_profit :=
        v_gross_profit
        - v_operating_expenses;


    -- ========================================================
    -- 17. UTILIDAD NETA
    -- ========================================================

    v_net_profit :=
        v_operating_profit
        - v_financial_expenses;


    -- ========================================================
    -- 18. RESPUESTA JSON
    -- ========================================================

    RETURN jsonb_build_object(

        'period',
        v_period,

        'branch_id',
        p_branch_uuid,

        'revenues',
        jsonb_build_object(

            'gross_sales',
            ROUND(v_gross_sales, 2),

            'discounts',
            ROUND(v_discounts, 2),

            'net_sales',
            ROUND(v_net_sales, 2),

            'payment_breakdown',
            jsonb_build_object(

                'cash',
                ROUND(v_cash_sales, 2),

                'card',
                ROUND(v_card_sales, 2),

                'transfer',
                ROUND(v_transfer_sales, 2),

                'digital_wallet',
                ROUND(v_digital_wallet_sales, 2)
            )
        ),

        'cogs',
        jsonb_build_object(

            'total',
            ROUND(v_cogs, 2),

            'breakdown',
            v_cogs_breakdown
        ),

        'gross_profit',
        ROUND(v_gross_profit, 2),

        'operating_expenses',
        jsonb_build_object(

            'total',
            ROUND(v_operating_expenses, 2),

            'breakdown',
            v_operating_breakdown,

            'registered_expenses',
            ROUND(v_expenses_total, 2),

            'fixed_costs',
            ROUND(v_fixed_costs_total, 2)
        ),

        'operating_profit',
        ROUND(v_operating_profit, 2),

        'financial_expenses',
        jsonb_build_object(

            'total',
            ROUND(v_financial_expenses, 2),

            'breakdown',
            v_financial_breakdown
        ),

        'net_profit',
        ROUND(v_net_profit, 2)
    );

END;
$$;


-- ============================================================
-- 19. SEGURIDAD DE LA FUNCIÓN
-- ============================================================

REVOKE ALL
ON FUNCTION public.get_income_statement(UUID, INTEGER, INTEGER)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.get_income_statement(UUID, INTEGER, INTEGER)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.get_income_statement(UUID, INTEGER, INTEGER)
TO authenticated;