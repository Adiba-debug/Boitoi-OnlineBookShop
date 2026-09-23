
-- BLOCKED
CREATE OR REPLACE PROCEDURE block_customer(
    p_user_id INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users
    SET is_blocked = TRUE
    WHERE user_id = p_user_id
      AND role = 'customer';
END;
$$;
-- UNBLOCK
CREATE OR REPLACE PROCEDURE unblock_customer(
    p_user_id INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users
    SET is_blocked = FALSE
    WHERE user_id = p_user_id
      AND role = 'customer';
END;
$$;





SELECT user_id, name, email, role, is_blocked
FROM users
WHERE role = 'customer'
ORDER BY user_id;




CALL block_customer(1);
CALL unblock_customer(1);

