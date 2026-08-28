CREATE OR REPLACE FUNCTION public.get_income_statement_by_date(
    p_branch_uuid UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
    v_period TEXT;

    v_organization_id UUID;

    -- Ventas
    v_gross_sales NUMERIC := 0;
    v_discounts NUMERIC := 0;
    v_net_sales NUMERIC := 0;


    v_cash_sales NUMERIC := 0;
    v_card_sales NUMERIC := 0;
    v_manual_card_sales NUMERIC := 0;
    v_transfer_sales NUMERIC := 0;
    v_digital_wallet_sales NUMERIC := 0;

    -- COGS
    v_cogs NUMERIC := 0;

    -- OPEX
    v_expenses_total NUMERIC := 0;
    v_fixed_costs_total NUMERIC := 0;
    v_payroll_total NUMERIC := 0;
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

    IF p_start_date IS NULL THEN
        RAISE EXCEPTION
            'INVALID_START_DATE: p_start_date es obligatorio.';
    END IF;

    IF p_end_date IS NULL THEN
        RAISE EXCEPTION
            'INVALID_END_DATE: p_end_date es obligatorio.';
    END IF;

    IF p_start_date > p_end_date THEN
        RAISE EXCEPTION
            'INVALID_DATE_RANGE: p_start_date no puede ser mayor a p_end_date.';
    END IF;


    -- ========================================================
    -- 2. DEFINIR PERIODO CON ZONA HORARIA (America/Mexico_City)
    -- ========================================================

    v_period_start := (p_start_date::TEXT || ' 00:00:00 America/Mexico_City')::TIMESTAMPTZ;
    v_period_end := ((p_end_date + INTERVAL '1 day')::DATE::TEXT || ' 00:00:00 America/Mexico_City')::TIMESTAMPTZ;

    v_period := to_char(p_start_date, 'YYYY-MM-DD') || ' a ' || to_char(p_end_date, 'YYYY-MM-DD');


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
    -- 6. VENTAS POR MÉTODO DE PAGO (Desde Cortes de Caja)
    -- ========================================================

    SELECT
        COALESCE(SUM(cc.cash_sales), 0),
        COALESCE(SUM(cc.pos_terminal_sales), 0)
    INTO
        v_cash_sales,
        v_card_sales
    FROM public.cash_closures cc
    WHERE cc.branch_id = p_branch_uuid
      AND cc.close_date >= (v_period_start AT TIME ZONE 'America/Mexico_City')::DATE
      AND cc.close_date <= ((v_period_end - INTERVAL '1 second') AT TIME ZONE 'America/Mexico_City')::DATE;

    v_transfer_sales := 0;
    v_digital_wallet_sales := 0;


    -- ========================================================
    -- 7. COGS (Costo de Bienes Vendidos)
    -- ========================================================

    SELECT
        COALESCE(SUM(e.amount), 0)
    INTO v_cogs
    FROM public.expenses e
    WHERE e.branch_id = p_branch_uuid
      AND e.category LIKE 'PEDIDO%'
      AND e.date >= (v_period_start AT TIME ZONE 'America/Mexico_City')::DATE
      AND e.date <= ((v_period_end - INTERVAL '1 second') AT TIME ZONE 'America/Mexico_City')::DATE;

    -- ========================================================
    -- 8. BREAKDOWN DE COGS
    -- ========================================================

    SELECT
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'category', e.category,
                    'concept', e.concept,
                    'amount', e.amount
                )
                ORDER BY e.date
            ),
            '[]'::JSONB
        )
    INTO v_cogs_breakdown
    FROM public.expenses e
    WHERE e.branch_id = p_branch_uuid
      AND e.category LIKE 'PEDIDO%'
      AND e.date >= (v_period_start AT TIME ZONE 'America/Mexico_City')::DATE
      AND e.date <= ((v_period_end - INTERVAL '1 second') AT TIME ZONE 'America/Mexico_City')::DATE;


    -- ========================================================
    -- 9. GASTOS OPERATIVOS
    -- ========================================================

    SELECT
        COALESCE(SUM(e.amount), 0)
    INTO v_expenses_total
    FROM public.expenses e
    WHERE e.branch_id = p_branch_uuid
      AND e.category NOT LIKE 'PEDIDO%'
      AND e.date >= (v_period_start AT TIME ZONE 'America/Mexico_City')::DATE
      AND e.date <= ((v_period_end - INTERVAL '1 second') AT TIME ZONE 'America/Mexico_City')::DATE;


    -- ========================================================
    -- 10. COSTOS FIJOS Y NÓMINA (Por Mes)
    -- ========================================================

    SELECT
        COALESCE(SUM(bfc.amount), 0)
    INTO v_fixed_costs_total
    FROM public.branch_fixed_costs bfc
    WHERE bfc.branch_id = p_branch_uuid
      AND bfc.month_year = to_char(v_period_start AT TIME ZONE 'America/Mexico_City', 'YYYY-MM');

    SELECT
        COALESCE(SUM(bp.total_to_pay), 0)
    INTO v_payroll_total
    FROM public.branch_payroll bp
    WHERE bp.branch_id = p_branch_uuid
      AND bp.month_year = to_char(v_period_start AT TIME ZONE 'America/Mexico_City', 'YYYY-MM');


    -- ========================================================
    -- 11. OPEX TOTAL
    -- ========================================================

    v_operating_expenses :=
        COALESCE(v_expenses_total, 0)
        + COALESCE(v_fixed_costs_total, 0)
        + COALESCE(v_payroll_total, 0);


    -- ========================================================
    -- 12. BREAKDOWN DE OPEX
    -- ========================================================

    WITH expense_breakdown AS (
        SELECT
            e.category,
            SUM(e.amount) AS amount
        FROM public.expenses e
        WHERE e.branch_id = p_branch_uuid
          AND e.category NOT LIKE 'PEDIDO%'
          AND e.date >= (v_period_start AT TIME ZONE 'America/Mexico_City')::DATE
          AND e.date <= ((v_period_end - INTERVAL '1 second') AT TIME ZONE 'America/Mexico_City')::DATE
        GROUP BY e.category
    ),
    fixed_breakdown AS (
        SELECT
            bfc.category,
            SUM(bfc.amount) AS amount
        FROM public.branch_fixed_costs bfc
        WHERE bfc.branch_id = p_branch_uuid
          AND bfc.month_year = to_char(v_period_start AT TIME ZONE 'America/Mexico_City', 'YYYY-MM')
        GROUP BY bfc.category
    ),
    payroll_breakdown AS (
        SELECT
            'NÓMINA' AS category,
            SUM(bp.total_to_pay) AS amount
        FROM public.branch_payroll bp
        WHERE bp.branch_id = p_branch_uuid
          AND bp.month_year = to_char(v_period_start AT TIME ZONE 'America/Mexico_City', 'YYYY-MM')
        HAVING SUM(bp.total_to_pay) > 0
    ),
    combined AS (
        SELECT
            category,
            SUM(amount) AS amount
        FROM (
            SELECT * FROM expense_breakdown
            UNION ALL
            SELECT * FROM fixed_breakdown
            UNION ALL
            SELECT * FROM payroll_breakdown
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

    SELECT
        COALESCE(bs.card_commission_percentage, 2.5)
    INTO v_card_commission_percentage
    FROM public.branch_settings bs
    WHERE bs.branch_id = p_branch_uuid
    LIMIT 1;

    v_card_commission_percentage := COALESCE(v_card_commission_percentage, 2.5);


    -- ========================================================
    -- 14. GASTOS FINANCIEROS
    -- ========================================================

    v_financial_expenses :=
        ROUND(
            (COALESCE(v_card_sales, 0) * v_card_commission_percentage / 100),
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

    v_gross_profit := v_net_sales - v_cogs;


    -- ========================================================
    -- 16. UTILIDAD OPERATIVA / EBIT
    -- ========================================================

    v_operating_profit := v_gross_profit - v_operating_expenses;


    -- ========================================================
    -- 17. UTILIDAD NETA
    -- ========================================================

    v_net_profit := v_operating_profit - v_financial_expenses;


    -- ========================================================
    -- 18. RESPUESTA JSON
    -- ========================================================

    RETURN jsonb_build_object(
        'period', v_period,
        'branch_id', p_branch_uuid,
        'revenues', jsonb_build_object(
            'gross_sales', ROUND(v_gross_sales, 2),
            'discounts', ROUND(v_discounts, 2),
            'net_sales', ROUND(v_net_sales, 2),
            'payment_breakdown', jsonb_build_object(
                'cash', ROUND(v_cash_sales, 2),
                'card', ROUND(v_card_sales, 2),
                'transfer', ROUND(v_transfer_sales, 2),
                'digital_wallet', ROUND(v_digital_wallet_sales, 2)
            )
        ),
        'cogs', jsonb_build_object(
            'total', ROUND(v_cogs, 2),
            'breakdown', v_cogs_breakdown
        ),
        'gross_profit', ROUND(v_gross_profit, 2),
        'operating_expenses', jsonb_build_object(
            'total', ROUND(v_operating_expenses, 2),
            'breakdown', v_operating_breakdown,
            'registered_expenses', ROUND(v_expenses_total, 2),
            'fixed_costs', ROUND(v_fixed_costs_total, 2),
            'payroll', ROUND(v_payroll_total, 2)
        ),
        'operating_profit', ROUND(v_operating_profit, 2),
        'financial_expenses', jsonb_build_object(
            'total', ROUND(v_financial_expenses, 2),
            'breakdown', v_financial_breakdown
        ),
        'net_profit', ROUND(v_net_profit, 2)
    );

END;
$$;
