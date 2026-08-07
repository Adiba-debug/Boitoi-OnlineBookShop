CREATE TABLE BOOK_AUTHORS
(
    book_id INT NOT NULL,
    author_id INT NOT NULL,

    PRIMARY KEY(book_id, author_id),

    FOREIGN KEY(book_id)
        REFERENCES books(book_id)
        ON DELETE CASCADE,

    FOREIGN KEY(author_id)
        REFERENCES authors(author_id)
        ON DELETE CASCADE
);