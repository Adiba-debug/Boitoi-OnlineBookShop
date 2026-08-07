CREATE TABLE CATEGORIES
(
	CATEGORY_ID SERIAL PRIMARY KEY,
	CATEGORY_NAME VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO categories
(category_id, category_name)
VALUES
(1, 'Novel'),
(2, 'Science Fiction'),
(3, 'Mystery'),
(4, 'Thriller'),
(5, 'Horror'),
(6, 'Fantasy'),
(7, 'Romance'),
(8, 'Adventure'),
(9, 'Historical'),
(10, 'Biography'),
(11, 'Poetry'),
(12, 'Children'),
(13, 'Academic'),
(14, 'Programming'),
(15, 'Computer Science'),
(16, 'Self-Help'),
(17, 'Religion'),
(18, 'Business'),
(19, 'Comics & Manga'),
(20, 'Translated Books'),
(21, 'Fiction'),
(22,'Historical Fiction'),
(23, 'Autobiography'),
(24, 'Drama'),
(25, 'Philosophy'),
(26, 'Technology'),
(27, 'Agriculture'),
(28, 'Politics'),
(29, 'School Academic'),
(30, 'College Academic'),
(31, 'Admission'),
(32, 'Bangladesh Liberation War'),
(33, 'Olympiad'),
(34, 'Comics'),
(35, 'Classic Literature');