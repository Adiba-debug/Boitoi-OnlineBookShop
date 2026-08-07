SET search_path TO public;

CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    author_name VARCHAR(150) NOT NULL,
    bio TEXT,
    image_url VARCHAR(255)
);

