CREATE TABLE BOOKS
(
	BOOK_ID SERIAL PRIMARY KEY,
	TITLE VARCHAR(255) NOT NULL,
	PRICE DECIMAL(10,2) NOT NULL,
	STOCK INT NOT NULL,
	TOTAL_SOLD INT NOT NULL,
	DESCRIPTION TEXT ,

	ADMIN_ID INT NOT NULL,
	PUBLISHER_ID INT NOT NULL,
	AUTHOR_ID INT NOT NULL,
	CATEGORY_ID INT NOT NULL,

	FOREIGN KEY(ADMIN_ID) REFERENCES USERS(USER_ID) ON DELETE RESTRICT,
	FOREIGN KEY(PUBLISHER_ID) REFERENCES PUBLISHERS(PUBLISHER_ID) ON DELETE RESTRICT,
	FOREIGN KEY(AUTHOR_ID) REFERENCES AUTHORS(AUTHOR_ID) ON DELETE RESTRICT,
	FOREIGN KEY(CATEGORY_ID) REFERENCES CATEGORIES(CATEGORY_ID) ON DELETE SET NULL
);


INSERT INTO books
(book_id, title, price, stock, total_sold, description, admin_id, publisher_id, author_id, category_id)
VALUES

(1012, 'The Alchemist', 650.00, 25, 120,
'A philosophical novel about a young shepherd who follows his dream and discovers the meaning of life.',
104, 1, 1, 1),

(1013, 'The Silent Patient', 798.00, 20, 95,
'A psychological thriller about a woman who stops speaking after a mysterious crime.',
105, 1, 2, 4),

(1014, 'Harry Potter and the Philosophers Stone', 850.00, 30, 200,
'The beginning of Harry Potter journey into the magical world of Hogwarts.',
104, 2, 3, 3),

(1015, '1984', 680.00, 18, 85,
'A dystopian novel about surveillance, freedom, and a society controlled by a powerful government.',
105, 3, 4, 2),

(1016, 'The Old Man and the Sea', 500.00, 15, 70,
'A story of an old fisherman struggle, courage, and determination against the sea.',
106, 4, 5, 1),

(1017, 'Inferno', 920.00, 12, 65,
'A thrilling mystery where Robert Langdon investigates secrets connected with Dante history.',
107, 5, 6, 4),

(1018, 'Angels and Demons', 880.00, 14, 80,
'A mystery thriller involving the Illuminati and a race to save Vatican City.',
108, 5, 6, 4),

(1019, 'The Da Vinci Code', 950.00, 16, 150,
'A mystery adventure involving hidden secrets, art, history, and ancient mysteries.',
107, 5, 6, 4),

(1020, 'Origin', 980.00, 10, 45,
'Robert Langdon explores a scientific discovery that challenges humanitys understanding of existence.',
104, 5, 6, 4),

(1021, 'The Shining', 780.00, 13, 60,
'A psychological horror novel about a family trapped in a haunted hotel.',
104, 6, 7, 5),

(1022, 'Metamorphosis', 450.00, 20, 90,
'A classic novella exploring identity, isolation, and human relationships through Gregor Samsa.',
104, 7, 8, 1),

(1023, 'Himu', 420.00, 25, 300,
'A popular Humayun Ahmed novel featuring the mysterious and free spirited character Himu.',
104, 8, 9, 1),

(1024, 'Devi', 480.00, 18, 250,
'A psychological mystery novel by Humayun Ahmed featuring Misir Ali.',
106, 8, 9, 4),

(1025, 'Nondito Noroke', 450.00, 22, 220,
'Humayun Ahmeds debut novel focusing on family, emotions, and relationships.',
105, 8, 9, 1),

(1026, 'Kothao Keu Nei', 490.00, 15, 180,
'A famous Humayun Ahmed novel about friendship, justice, and human emotions.',
105, 8, 9, 1),

(1027, 'Shonkhonil Karagar', 550.00, 17, 160,
'A touching novel by Humayun Ahmed about family and emotional struggles.',
105, 8, 9, 1),

(1028, 'Shrabon Megher Din', 520.00, 14, 100,
'A romantic and emotional story by Humayun Ahmed.',
105, 8, 9, 7),

(1029, 'Pather Panchali', 650.00, 19, 140,
'A classic Bengali novel portraying rural life through Apu and his family.',
106, 9, 10, 1),

(1030, 'Aparajito', 690.00, 12, 90,
'The journey of Apu as he grows through education and life experiences.',
104, 9, 10, 1),

(1031, 'Chander Pahar', 720.00, 16, 130,
'An adventurous story about a young Bengali exploring Africa.',
104, 9, 10, 8),

(1032, 'Padma Nodir Majhi', 620.00, 15, 110,
'A novel about fishermen life and struggles beside the Padma River.',
105, 10, 11, 1),

(1033, 'Devdas', 530.00, 20, 170,
'A tragic love story about Devdas, Parvati, and Chandramukhi.',
107, 11, 12, 7),

(1034, 'Srikanta', 760.00, 10, 75,
'A classic novel following Srikantas journey through life and society.',
108, 11, 12, 1),

(1035, 'Shesher Kobita', 580.00, 14, 100,
'A romantic novel by Rabindranath Tagore exploring love and individuality.',
107, 12, 13, 7),

(1036, 'Chokher Bali', 560.00, 13, 95,
'A novel about relationships, emotions, and social traditions.',
107, 12, 13, 1),

(1037, 'Atomic Habits', 700.00, 20, 190,
'A practical guide to building good habits and improving daily life.',
108, 13, 14, 16),

(1038, 'Clean Code', 850.00, 12, 80,
'A programming book about writing clean and maintainable software.',
107, 14, 15, 20),

(1039, 'Introduction to Algorithms', 1200.00, 8, 60,
'A comprehensive book covering fundamental algorithms and data structures.',
108, 14, 16, 20),

(1040, 'The Psychology of Money', 750.00, 18, 130,
'A book exploring human behavior and decision making related to money.',
104, 13, 17, 16);
