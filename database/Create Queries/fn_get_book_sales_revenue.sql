

SET search_path TO public;

DROP FUNCTION IF EXISTS fn_get_book_sales_revenue();

CREATE OR REPLACE FUNCTION fn_get_book_sales_revenue()
RETURNS NUMERIC(12, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_revenue NUMERIC(12, 2);
BEGIN
    SELECT
        COALESCE(
            SUM(total_amount - delivery_charge),
            0.00
        )
    INTO v_revenue
    FROM orders
    WHERE status = 'delivered';

    RETURN v_revenue;
END;
$$;
