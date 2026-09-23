CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
	address VARCHAR(250) ,
	phone_number VARCHAR(15) UNIQUE,
    password VARCHAR(255) NOT NULL,
	role VARCHAR(20) NOT NULL DEFAULT 'customer'
	CHECK(role IN ('customer', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;