

SET search_path TO public;


-- ============================================================
-- 1. TABLE: order_status_history
-- ============================================================

CREATE TABLE IF NOT EXISTS order_status_history (
    history_id  SERIAL PRIMARY KEY,
    order_id    INT          NOT NULL
                    REFERENCES orders(order_id) ON DELETE CASCADE,
    old_status  VARCHAR(50),
    new_status  VARCHAR(50)  NOT NULL,
    changed_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. TRIGGER FUNCTION: fn_record_order_status_change
--    Inserts one row into order_status_history whenever
--    orders.status changes to a different value.
-- ============================================================

DROP FUNCTION IF EXISTS fn_record_order_status_change() CASCADE;

CREATE OR REPLACE FUNCTION fn_record_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only act when the status column actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history
            (order_id, old_status, new_status, changed_at)
        VALUES
            (OLD.order_id, OLD.status, NEW.status, CURRENT_TIMESTAMP);
    END IF;

    RETURN NEW;
END;
$$;


-- ============================================================
-- 3. TRIGGER: trg_order_status_history
--    Fires AFTER every UPDATE on orders, FOR EACH ROW.
-- ============================================================

DROP TRIGGER IF EXISTS trg_order_status_history ON orders;

CREATE TRIGGER trg_order_status_history
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION fn_record_order_status_change();




-- See the full history, newest first:
-- SELECT * FROM order_status_history ORDER BY changed_at DESC;

-- See the full history for one specific order:
-- SELECT * FROM order_status_history WHERE order_id = <order_id> ORDER BY changed_at;

-- Manual test (replace 1 with a real pending order_id):
-- UPDATE orders SET status = 'processing' WHERE order_id = 1;
-- SELECT * FROM order_status_history WHERE order_id = 1;
