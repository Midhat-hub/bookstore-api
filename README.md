# Bookstore REST API

A complete, beginner-friendly Node.js Express REST API for managing a bookstore inventory, backed by PostgreSQL.

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Architecture & Functions](#architecture--functions)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [Database Migration](#database-migration)
- [Running the Application](#running-the-application)
- [Running Automated Tests](#running-automated-tests)
- [API Endpoints Reference](#api-endpoints-reference)

---

## Overview

This API provides endpoints to create, retrieve, update, and delete book records stored in a PostgreSQL database.

Each book record contains:
- `id` (integer, auto-generated primary key)
- `title` (string, required)
- `author` (string, required)
- `price` (numeric, required, non-negative)
- `stock_quantity` (integer, non-negative, default `0`)
- `created_at` (timestamp with time zone, auto-generated)

---

## Project Structure

```text
bookstore-api/
├── migrations/
│   └── 001_create_books.sql    # Database schema definition
├── src/
│   ├── app.js                  # Express app factory with route mounts
│   ├── server.js               # Application entry point and HTTP server listener
│   ├── config/
│   │   └── config.js           # Environment variable loader
│   ├── controllers/
│   │   └── bookController.js   # HTTP request/response handlers
│   ├── db/
│   │   └── database.js         # PostgreSQL connection pool and query runner
│   ├── middleware/
│   │   └── errorHandler.js     # Centralized error handler middleware
│   ├── routes/
│   │   └── bookRoutes.js       # Express router definitions
│   └── services/
│       └── bookService.js      # Business logic and database operations
├── tests/
│   ├── bookRoutes.test.js      # HTTP integration tests (Supertest)
│   └── bookService.test.js     # Service unit tests
├── .env.example                # Example environment variable file
├── .gitignore                  # Git ignore rules
├── package.json                # Project dependencies and npm scripts
└── README.md                   # Project documentation
```

---

## Architecture & Functions

The project cleanly separates concerns into focused modules:

| Module | File | Named Functions | Responsibility |
|---|---|---|---|
| **App** | `src/app.js` | `createApp` | Configures Express, mounts middleware, routes, and handles dependency injection. |
| **Database** | `src/db/database.js` | `query`, `closePool` | Manages PostgreSQL connection pool and executes parameterized queries. |
| **Controller** | `src/controllers/bookController.js` | `getBooks`, `getBookById`, `createBook`, `updateBook`, `deleteBook` | Receives HTTP requests, calls the service layer, and sends responses. |
| **Service** | `src/services/bookService.js` | `validateBookInput`, `getAllBooks`, `getBookById`, `createBook`, `updateBook`, `deleteBook` | Validates inputs, implements business rules, and orchestrates database queries. |
| **Middleware** | `src/middleware/errorHandler.js` | `errorHandler` | Formats and returns standardized JSON error responses. |

Total named application functions in `src/`: **15**.

---

## Prerequisites

- **Node.js** (v18.0.0 or higher recommended, tested on Node v25)
- **PostgreSQL** (v12 or higher)

---

## Installation & Setup

1. Clone or open the repository:
   ```bash
   cd bookstore-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## Environment Configuration

1. Copy `.env.example` to create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*

2. Open `.env` and fill in your PostgreSQL credentials:
   ```ini
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=bookstore
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```

3. Ensure the target PostgreSQL database exists. If needed, create it via `psql`:
   ```sql
   CREATE DATABASE bookstore;
   ```

---

## Database Migration

Run the migration script to create the `books` table:

```bash
npm run migrate
```

Alternatively, you can apply the migration directly using `psql`:
```bash
psql -h localhost -U postgres -d bookstore -f migrations/001_create_books.sql
```

---

## Running the Application

To start the API server:

```bash
npm start
```

The server will start on the port configured in `.env` (default: `http://localhost:3000`):
```text
Bookstore API listening on port 3000
```

---

## Running Automated Tests

The test suite uses Node.js's built-in test runner (`node:test`) and `supertest`.

Tests use dependency injection with a mock database layer, meaning **tests run immediately without requiring a live PostgreSQL instance**.

To execute all tests:

```bash
npm test
```

This runs:
- `tests/bookService.test.js` (Unit tests covering validation, queries, error handling)
- `tests/bookRoutes.test.js` (Integration tests covering HTTP endpoints and responses)

---

## API Endpoints Reference

### 1. Health Check

- **Endpoint:** `GET /health`
- **Description:** Verifies that the service is running.
- **Success Status:** `200 OK`
- **Example Response:**
  ```json
  {
    "status": "OK"
  }
  ```
- **Example Request:**
  ```bash
  curl http://localhost:3000/health
  ```

---

### 2. Get All Books

- **Endpoint:** `GET /api/books`
- **Description:** Retrieves all books ordered by ID.
- **Success Status:** `200 OK`
- **Example Response:**
  ```json
  [
    {
      "id": 1,
      "title": "The Pragmatic Programmer",
      "author": "David Thomas & Andrew Hunt",
      "price": 44.99,
      "stock_quantity": 10,
      "created_at": "2026-10-16T07:30:00.000Z"
    }
  ]
  ```
- **Example Request:**
  ```bash
  curl http://localhost:3000/api/books
  ```

---

### 3. Get Book by ID

- **Endpoint:** `GET /api/books/:id`
- **Description:** Retrieves a specific book by its ID.
- **Success Status:** `200 OK`
- **Error Statuses:**
  - `400 Bad Request` (Invalid ID format)
  - `404 Not Found` (Book not found)
- **Example Response:**
  ```json
  {
    "id": 1,
    "title": "The Pragmatic Programmer",
    "author": "David Thomas & Andrew Hunt",
    "price": 44.99,
    "stock_quantity": 10,
    "created_at": "2026-10-16T07:30:00.000Z"
  }
  ```
- **Example Request:**
  ```bash
  curl http://localhost:3000/api/books/1
  ```

---

### 4. Create a New Book

- **Endpoint:** `POST /api/books`
- **Description:** Adds a new book to the inventory.
- **Success Status:** `201 Created`
- **Error Statuses:**
  - `400 Bad Request` (Missing or invalid title, author, price, or stock_quantity)
- **Request Body:**
  ```json
  {
    "title": "Clean Architecture",
    "author": "Robert C. Martin",
    "price": 38.50,
    "stock_quantity": 15
  }
  ```
- **Example Response:**
  ```json
  {
    "id": 2,
    "title": "Clean Architecture",
    "author": "Robert C. Martin",
    "price": 38.50,
    "stock_quantity": 15,
    "created_at": "2026-10-16T07:35:00.000Z"
  }
  ```
- **Example Request:**
  ```bash
  curl -X POST http://localhost:3000/api/books \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Clean Architecture\",\"author\":\"Robert C. Martin\",\"price\":38.50,\"stock_quantity\":15}"
  ```

---

### 5. Update a Book

- **Endpoint:** `PUT /api/books/:id`
- **Description:** Updates fields of an existing book. Supports full or partial updates.
- **Success Status:** `200 OK`
- **Error Statuses:**
  - `400 Bad Request` (Invalid ID, invalid field values, or empty update payload)
  - `404 Not Found` (Book not found)
- **Request Body (example updating price and stock):**
  ```json
  {
    "price": 34.99,
    "stock_quantity": 20
  }
  ```
- **Example Response:**
  ```json
  {
    "id": 2,
    "title": "Clean Architecture",
    "author": "Robert C. Martin",
    "price": 34.99,
    "stock_quantity": 20,
    "created_at": "2026-10-16T07:35:00.000Z"
  }
  ```
- **Example Request:**
  ```bash
  curl -X PUT http://localhost:3000/api/books/2 \
    -H "Content-Type: application/json" \
    -d "{\"price\":34.99,\"stock_quantity\":20}"
  ```

---

### 6. Delete a Book

- **Endpoint:** `DELETE /api/books/:id`
- **Description:** Deletes a book by its ID.
- **Success Status:** `200 OK`
- **Error Statuses:**
  - `400 Bad Request` (Invalid ID format)
  - `404 Not Found` (Book not found)
- **Example Response:**
  ```json
  {
    "message": "Book deleted successfully",
    "book": {
      "id": 2,
      "title": "Clean Architecture",
      "author": "Robert C. Martin",
      "price": 34.99,
      "stock_quantity": 20,
      "created_at": "2026-10-16T07:35:00.000Z"
    }
  }
  ```
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:3000/api/books/2
  ```

Catchup automatic polling test.

Catchup queue test A.

Catchup queue test B.
