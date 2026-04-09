-- ============================================================
--  Library Management System — Full MSSQL Database Schema
--  Generated from Laravel migrations
--  Database: library_management
-- ============================================================

USE library_management;
GO

-- ============================================================
-- TABLE: personal_access_tokens  (Laravel Sanctum)
-- ============================================================
CREATE TABLE personal_access_tokens (
    id                 BIGINT IDENTITY(1,1) NOT NULL,
    tokenable_type     NVARCHAR(255)        NOT NULL,
    tokenable_id       BIGINT               NOT NULL,
    name               NVARCHAR(255)        NOT NULL,
    token              NVARCHAR(64)         NOT NULL,
    abilities          NVARCHAR(MAX)        NULL,
    last_used_at       DATETIME2            NULL,
    expires_at         DATETIME2            NULL,
    created_at         DATETIME2            NULL,
    updated_at         DATETIME2            NULL,

    CONSTRAINT PK_personal_access_tokens PRIMARY KEY (id),
    CONSTRAINT UQ_personal_access_tokens_token UNIQUE (token)
);
GO

CREATE INDEX IX_personal_access_tokens_tokenable
    ON personal_access_tokens (tokenable_type, tokenable_id);
GO

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id                 BIGINT IDENTITY(1,1) NOT NULL,
    name               NVARCHAR(255)        NOT NULL,
    email              NVARCHAR(255)        NOT NULL,
    password           NVARCHAR(255)        NOT NULL,
    type               NVARCHAR(20)         NOT NULL  DEFAULT 'member',
    status             NVARCHAR(20)         NOT NULL  DEFAULT 'active',
    email_verified_at  DATETIME2            NULL,
    remember_token     NVARCHAR(100)        NULL,
    deleted_at         DATETIME2            NULL,      -- soft delete
    created_at         DATETIME2            NULL,
    updated_at         DATETIME2            NULL,

    CONSTRAINT PK_users PRIMARY KEY (id),
    CONSTRAINT UQ_users_email UNIQUE (email)
);
GO

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE categories (
    id          BIGINT IDENTITY(1,1) NOT NULL,
    name        NVARCHAR(255)        NOT NULL,
    created_at  DATETIME2            NULL,
    updated_at  DATETIME2            NULL,

    CONSTRAINT PK_categories PRIMARY KEY (id),
    CONSTRAINT UQ_categories_name UNIQUE (name)
);
GO

-- ============================================================
-- TABLE: books
-- ============================================================
CREATE TABLE books (
    id           BIGINT IDENTITY(1,1) NOT NULL,
    title        NVARCHAR(255)        NOT NULL,
    author       NVARCHAR(255)        NOT NULL,
    description  NVARCHAR(2000)       NULL,
    isbn_no      NVARCHAR(20)         NOT NULL,
    image_path   NVARCHAR(255)        NULL,
    category_id  BIGINT               NOT NULL,
    created_at   DATETIME2            NULL,
    updated_at   DATETIME2            NULL,

    CONSTRAINT PK_books PRIMARY KEY (id),
    CONSTRAINT UQ_books_isbn_no UNIQUE (isbn_no),
    CONSTRAINT FK_books_category
        FOREIGN KEY (category_id)
        REFERENCES categories (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);
GO

-- ============================================================
-- TABLE: records  (borrowing records)
-- ============================================================
CREATE TABLE records (
    id           BIGINT IDENTITY(1,1) NOT NULL,
    user_id      BIGINT               NOT NULL,
    book_id      BIGINT               NOT NULL,
    borrowed_at  DATETIME2            NOT NULL,
    due_date     DATETIME2            NOT NULL,
    returned_at  DATETIME2            NULL,      -- NULL = still borrowed
    created_at   DATETIME2            NULL,
    updated_at   DATETIME2            NULL,

    CONSTRAINT PK_records PRIMARY KEY (id),
    CONSTRAINT FK_records_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT FK_records_book
        FOREIGN KEY (book_id)
        REFERENCES books (id)
        ON DELETE CASCADE
);
GO

-- ============================================================
-- TABLE: migrations  (Laravel internal — tracks what has run)
-- ============================================================
CREATE TABLE migrations (
    id        INT IDENTITY(1,1) NOT NULL,
    migration NVARCHAR(255)     NOT NULL,
    batch     INT               NOT NULL,

    CONSTRAINT PK_migrations PRIMARY KEY (id)
);
GO

-- ============================================================
-- SEED DATA
-- ============================================================

-- Categories
INSERT INTO categories (name, created_at, updated_at) VALUES
('Action',      GETDATE(), GETDATE()),
('Romance',     GETDATE(), GETDATE()),
('Thriller',    GETDATE(), GETDATE()),
('Horror',      GETDATE(), GETDATE()),
('Documentary', GETDATE(), GETDATE());
GO

-- Admin user  (password = Admin@1234  bcrypt-hashed)
INSERT INTO users (name, email, password, type, status, created_at, updated_at)
VALUES (
    'Library Admin',
    'admin@library.com',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin', 'active', GETDATE(), GETDATE()
);
GO

-- Member user  (password = Member@1234  bcrypt-hashed)
INSERT INTO users (name, email, password, type, status, created_at, updated_at)
VALUES (
    'Jane Member',
    'member@library.com',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'member', 'active', GETDATE(), GETDATE()
);
GO

-- Sample Books
INSERT INTO books (title, author, description, isbn_no, category_id, created_at, updated_at)
SELECT 'The Dark Knight Returns', 'Frank Miller',
       'A dark tale of Batman coming out of retirement.',
       '9780930289454', id, GETDATE(), GETDATE()
FROM categories WHERE name = 'Action';

INSERT INTO books (title, author, description, isbn_no, category_id, created_at, updated_at)
SELECT 'Die Hard: The Novel', 'Roderick Thorp',
       'The book that inspired the legendary movie.',
       '9780393308600', id, GETDATE(), GETDATE()
FROM categories WHERE name = 'Action';

INSERT INTO books (title, author, description, isbn_no, category_id, created_at, updated_at)
SELECT 'Pride and Prejudice', 'Jane Austen',
       'A timeless story of love and social standing in England.',
       '9780141439518', id, GETDATE(), GETDATE()
FROM categories WHERE name = 'Romance';

INSERT INTO books (title, author, description, isbn_no, category_id, created_at, updated_at)
SELECT 'The Notebook', 'Nicholas Sparks',
       'A moving story of love, loss, and memory.',
       '9780553816716', id, GETDATE(), GETDATE()
FROM categories WHERE name = 'Romance';

INSERT INTO books (title, author, description, isbn_no, category_id, created_at, updated_at)
SELECT 'Gone Girl', 'Gillian Flynn',
       'A gripping psychological thriller about a missing wife.',
       '9780307588371', id, GETDATE(), GETDATE()
FROM categories WHERE name = 'Thriller';

INSERT INTO books (title, author, description, isbn_no, category_id, created_at, updated_at)
SELECT 'The Girl with the Dragon Tattoo', 'Stieg Larsson',
       'A journalist investigates a decades-old disappearance.',
       '9780307949486', id, GETDATE(), GETDATE()
FROM categories WHERE name = 'Thriller';

INSERT INTO books (title, author, description, isbn_no, category_id, created_at, updated_at)
SELECT 'It', 'Stephen King',
       'A terrifying story about a shape-shifting evil in Derry, Maine.',
       '9781501142970', id, GETDATE(), GETDATE()
FROM categories WHERE name = 'Horror';

INSERT INTO books (title, author, description, isbn_no, category_id, created_at, updated_at)
SELECT 'The Haunting of Hill House', 'Shirley Jackson',
       'Four people investigate the supernatural in an old mansion.',
       '9780143039983', id, GETDATE(), GETDATE()
FROM categories WHERE name = 'Horror';

INSERT INTO books (title, author, description, isbn_no, category_id, created_at, updated_at)
SELECT 'A Brief History of Time', 'Stephen Hawking',
       'Hawking explains the nature of the universe in accessible terms.',
       '9780553380163', id, GETDATE(), GETDATE()
FROM categories WHERE name = 'Documentary';

INSERT INTO books (title, author, description, isbn_no, category_id, created_at, updated_at)
SELECT 'Sapiens', 'Yuval Noah Harari',
       'A narrative of human history from the Stone Age to the present.',
       '9780062316097', id, GETDATE(), GETDATE()
FROM categories WHERE name = 'Documentary';
GO
