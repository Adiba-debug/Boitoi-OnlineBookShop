CREATE TABLE publishers (
    publisher_id SERIAL PRIMARY KEY,
    publisher_name VARCHAR(150) NOT NULL,
    description TEXT,
    logo_url TEXT
);

