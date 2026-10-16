const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const createApp = require('../src/app');

describe('Bookstore API Routes - Integration Tests', () => {
  describe('GET /health', () => {
    test('should return 200 OK with health status', async () => {
      const app = createApp({});
      const response = await request(app).get('/health');

      assert.equal(response.status, 200);
      assert.deepEqual(response.body, { status: 'OK' });
    });
  });

  describe('GET /api/books', () => {
    test('should return 200 and a list of books', async () => {
      const mockBooks = [
        { id: 1, title: 'Book One', author: 'Author One', price: 19.99, stock_quantity: 5, created_at: '2026-01-01' },
        { id: 2, title: 'Book Two', author: 'Author Two', price: 29.99, stock_quantity: 10, created_at: '2026-01-02' },
      ];

      const mockDb = {
        query: async () => ({ rows: mockBooks }),
      };

      const app = createApp(mockDb);
      const response = await request(app).get('/api/books');

      assert.equal(response.status, 200);
      assert.equal(response.body.length, 2);
      assert.equal(response.body[0].title, 'Book One');
      assert.equal(response.body[1].title, 'Book Two');
    });
  });

  describe('GET /api/books/:id', () => {
    test('should return 200 and the requested book if found', async () => {
      const mockBook = {
        id: 1,
        title: 'Book One',
        author: 'Author One',
        price: 19.99,
        stock_quantity: 5,
        created_at: '2026-01-01',
      };

      const mockDb = {
        query: async () => ({ rows: [mockBook] }),
      };

      const app = createApp(mockDb);
      const response = await request(app).get('/api/books/1');

      assert.equal(response.status, 200);
      assert.equal(response.body.id, 1);
      assert.equal(response.body.title, 'Book One');
    });

    test('should return 400 if book id is invalid', async () => {
      const mockDb = { query: async () => ({ rows: [] }) };
      const app = createApp(mockDb);
      const response = await request(app).get('/api/books/invalid-id');

      assert.equal(response.status, 400);
      assert.equal(response.body.error.statusCode, 400);
    });

    test('should return 404 if book is not found', async () => {
      const mockDb = {
        query: async () => ({ rows: [] }),
      };

      const app = createApp(mockDb);
      const response = await request(app).get('/api/books/999');

      assert.equal(response.status, 404);
      assert.equal(response.body.error.statusCode, 404);
      assert.match(response.body.error.message, /not found/i);
    });
  });

  describe('POST /api/books', () => {
    test('should return 201 and created book when valid data is posted', async () => {
      const newBook = {
        title: 'Refactoring',
        author: 'Martin Fowler',
        price: 49.99,
        stock_quantity: 8,
      };

      const createdRecord = { id: 3, ...newBook, created_at: '2026-01-03' };

      const mockDb = {
        query: async () => ({ rows: [createdRecord] }),
      };

      const app = createApp(mockDb);
      const response = await request(app)
        .post('/api/books')
        .send(newBook);

      assert.equal(response.status, 201);
      assert.equal(response.body.id, 3);
      assert.equal(response.body.title, 'Refactoring');
    });

    test('should return 400 when title or author is missing', async () => {
      const app = createApp({});
      const response = await request(app)
        .post('/api/books')
        .send({ price: 19.99 });

      assert.equal(response.status, 400);
      assert.equal(response.body.error.statusCode, 400);
    });

    test('should return 400 when price is invalid', async () => {
      const app = createApp({});
      const response = await request(app)
        .post('/api/books')
        .send({ title: 'Book', author: 'Author', price: -10 });

      assert.equal(response.status, 400);
      assert.equal(response.body.error.statusCode, 400);
    });
  });

  describe('PUT /api/books/:id', () => {
    test('should return 200 and updated book on valid update', async () => {
      const existing = { id: 1, title: 'Old Title', author: 'Author', price: 10.0, stock_quantity: 4 };
      const updated = { id: 1, title: 'Updated Title', author: 'Author', price: 15.0, stock_quantity: 4 };

      const mockDb = {
        query: async (text) => {
          if (text.includes('SELECT')) return { rows: [existing] };
          if (text.includes('UPDATE')) return { rows: [updated] };
          return { rows: [] };
        },
      };

      const app = createApp(mockDb);
      const response = await request(app)
        .put('/api/books/1')
        .send({ title: 'Updated Title', price: 15.0 });

      assert.equal(response.status, 200);
      assert.equal(response.body.title, 'Updated Title');
      assert.equal(response.body.price, 15.0);
    });

    test('should return 404 if book to update is not found', async () => {
      const mockDb = {
        query: async () => ({ rows: [] }),
      };

      const app = createApp(mockDb);
      const response = await request(app)
        .put('/api/books/999')
        .send({ title: 'New Title' });

      assert.equal(response.status, 404);
      assert.equal(response.body.error.statusCode, 404);
    });

    test('should return 400 if update payload is empty', async () => {
      const existing = { id: 1, title: 'Old Title', author: 'Author', price: 10.0, stock_quantity: 4 };
      const mockDb = { query: async () => ({ rows: [existing] }) };

      const app = createApp(mockDb);
      const response = await request(app)
        .put('/api/books/1')
        .send({});

      assert.equal(response.status, 400);
      assert.equal(response.body.error.statusCode, 400);
    });
  });

  describe('DELETE /api/books/:id', () => {
    test('should return 200 and success message on successful delete', async () => {
      const deletedBook = { id: 2, title: 'Book To Delete', author: 'Author', price: 12.0, stock_quantity: 1 };

      const mockDb = {
        query: async () => ({ rows: [deletedBook] }),
      };

      const app = createApp(mockDb);
      const response = await request(app).delete('/api/books/2');

      assert.equal(response.status, 200);
      assert.equal(response.body.message, 'Book deleted successfully');
      assert.equal(response.body.book.id, 2);
    });

    test('should return 404 if book to delete is not found', async () => {
      const mockDb = {
        query: async () => ({ rows: [] }),
      };

      const app = createApp(mockDb);
      const response = await request(app).delete('/api/books/999');

      assert.equal(response.status, 404);
      assert.equal(response.body.error.statusCode, 404);
    });

    test('should return 400 if delete id is invalid', async () => {
      const mockDb = { query: async () => ({ rows: [] }) };
      const app = createApp(mockDb);
      const response = await request(app).delete('/api/books/invalid');

      assert.equal(response.status, 400);
      assert.equal(response.body.error.statusCode, 400);
    });
  });
});
