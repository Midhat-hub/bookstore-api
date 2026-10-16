const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const bookService = require('../src/services/bookService');

describe('bookService - Unit Tests', () => {
  describe('validateBookInput', () => {
    test('should validate and sanitize valid book input for creation', () => {
      const input = {
        title: '  The Pragmatic Programmer  ',
        author: '  Andy Hunt & Dave Thomas  ',
        price: '45.50',
        stock_quantity: 12,
      };

      const result = bookService.validateBookInput(input, false);

      assert.deepEqual(result, {
        title: 'The Pragmatic Programmer',
        author: 'Andy Hunt & Dave Thomas',
        price: 45.5,
        stock_quantity: 12,
      });
    });

    test('should default stock_quantity to 0 when omitted on creation', () => {
      const input = {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        price: 35.0,
      };

      const result = bookService.validateBookInput(input, false);

      assert.equal(result.stock_quantity, 0);
    });

    test('should throw 400 error when request body is not an object', () => {
      assert.throws(
        () => bookService.validateBookInput(null, false),
        (err) => err.statusCode === 400 && err.message.includes('valid JSON object')
      );
      assert.throws(
        () => bookService.validateBookInput('invalid', false),
        (err) => err.statusCode === 400
      );
    });

    test('should throw 400 error when title is missing or empty', () => {
      assert.throws(
        () => bookService.validateBookInput({ author: 'Author', price: 20 }, false),
        (err) => err.statusCode === 400 && err.message.includes('Title is required')
      );
      assert.throws(
        () => bookService.validateBookInput({ title: '   ', author: 'Author', price: 20 }, false),
        (err) => err.statusCode === 400 && err.message.includes('Title is required')
      );
    });

    test('should throw 400 error when author is missing or empty', () => {
      assert.throws(
        () => bookService.validateBookInput({ title: 'Title', price: 20 }, false),
        (err) => err.statusCode === 400 && err.message.includes('Author is required')
      );
      assert.throws(
        () => bookService.validateBookInput({ title: 'Title', author: '', price: 20 }, false),
        (err) => err.statusCode === 400 && err.message.includes('Author is required')
      );
    });

    test('should throw 400 error when price is negative or not a number', () => {
      assert.throws(
        () => bookService.validateBookInput({ title: 'T', author: 'A', price: -5 }, false),
        (err) => err.statusCode === 400 && err.message.includes('Price must be a valid')
      );
      assert.throws(
        () => bookService.validateBookInput({ title: 'T', author: 'A', price: 'abc' }, false),
        (err) => err.statusCode === 400 && err.message.includes('Price must be a valid')
      );
    });

    test('should throw 400 error when stock_quantity is negative or non-integer', () => {
      assert.throws(
        () => bookService.validateBookInput({ title: 'T', author: 'A', price: 10, stock_quantity: -1 }, false),
        (err) => err.statusCode === 400 && err.message.includes('Stock quantity must be a non-negative integer')
      );
      assert.throws(
        () => bookService.validateBookInput({ title: 'T', author: 'A', price: 10, stock_quantity: 4.5 }, false),
        (err) => err.statusCode === 400 && err.message.includes('Stock quantity must be a non-negative integer')
      );
    });

    test('should throw 400 error when update payload is empty', () => {
      assert.throws(
        () => bookService.validateBookInput({}, true),
        (err) => err.statusCode === 400 && err.message.includes('At least one field')
      );
    });

    test('should allow partial fields on update', () => {
      const result = bookService.validateBookInput({ price: 29.99 }, true);
      assert.deepEqual(result, { price: 29.99 });
    });
  });

  describe('getAllBooks', () => {
    test('should query the database and return list of books', async () => {
      const mockRows = [
        { id: 1, title: 'Book 1', author: 'Author 1', price: 10.99, stock_quantity: 5, created_at: new Date() },
        { id: 2, title: 'Book 2', author: 'Author 2', price: 15.99, stock_quantity: 3, created_at: new Date() },
      ];

      const mockDb = {
        query: async (text) => {
          assert.match(text, /SELECT .* FROM books ORDER BY id ASC/i);
          return { rows: mockRows };
        },
      };

      const books = await bookService.getAllBooks(mockDb);
      assert.equal(books.length, 2);
      assert.equal(books[0].title, 'Book 1');
      assert.equal(books[1].title, 'Book 2');
    });
  });

  describe('getBookById', () => {
    test('should return book when valid id is found', async () => {
      const mockBook = { id: 1, title: 'Book 1', author: 'Author 1', price: 19.99, stock_quantity: 10 };

      const mockDb = {
        query: async (text, params) => {
          assert.match(text, /SELECT .* FROM books WHERE id = \$1/i);
          assert.deepEqual(params, [1]);
          return { rows: [mockBook] };
        },
      };

      const book = await bookService.getBookById(1, mockDb);
      assert.deepEqual(book, mockBook);
    });

    test('should throw 400 error when id is not a positive integer', async () => {
      const mockDb = { query: async () => ({ rows: [] }) };

      await assert.rejects(
        async () => bookService.getBookById('invalid', mockDb),
        (err) => err.statusCode === 400 && err.message.includes('positive integer')
      );

      await assert.rejects(
        async () => bookService.getBookById(-3, mockDb),
        (err) => err.statusCode === 400
      );
    });

    test('should throw 404 error when book is not found', async () => {
      const mockDb = {
        query: async () => ({ rows: [] }),
      };

      await assert.rejects(
        async () => bookService.getBookById(999, mockDb),
        (err) => err.statusCode === 404 && err.message.includes('Book with id 999 not found')
      );
    });
  });

  describe('createBook', () => {
    test('should insert and return new book', async () => {
      const input = {
        title: 'JavaScript: The Good Parts',
        author: 'Douglas Crockford',
        price: 25.0,
        stock_quantity: 7,
      };

      const createdBook = { id: 10, ...input, created_at: new Date() };

      const mockDb = {
        query: async (text, params) => {
          assert.match(text, /INSERT INTO books/i);
          assert.deepEqual(params, [
            'JavaScript: The Good Parts',
            'Douglas Crockford',
            25.0,
            7,
          ]);
          return { rows: [createdBook] };
        },
      };

      const result = await bookService.createBook(input, mockDb);
      assert.equal(result.id, 10);
      assert.equal(result.title, input.title);
    });
  });

  describe('updateBook', () => {
    test('should update existing book and return updated record', async () => {
      const existing = {
        id: 5,
        title: 'Old Title',
        author: 'Old Author',
        price: 15.0,
        stock_quantity: 2,
      };

      const updatedRow = {
        id: 5,
        title: 'New Title',
        author: 'Old Author',
        price: 20.0,
        stock_quantity: 2,
      };

      const mockDb = {
        query: async (text, params) => {
          if (text.includes('SELECT')) {
            return { rows: [existing] };
          }
          if (text.includes('UPDATE')) {
            assert.deepEqual(params, ['New Title', 'Old Author', 20.0, 2, 5]);
            return { rows: [updatedRow] };
          }
          throw new Error('Unexpected query');
        },
      };

      const result = await bookService.updateBook(5, { title: 'New Title', price: 20.0 }, mockDb);
      assert.equal(result.title, 'New Title');
      assert.equal(result.price, 20.0);
    });

    test('should throw 404 if book to update does not exist', async () => {
      const mockDb = {
        query: async () => ({ rows: [] }),
      };

      await assert.rejects(
        async () => bookService.updateBook(999, { title: 'Updated' }, mockDb),
        (err) => err.statusCode === 404
      );
    });
  });

  describe('deleteBook', () => {
    test('should delete book and return deleted record', async () => {
      const deletedRecord = { id: 3, title: 'To Delete', author: 'Author', price: 9.99, stock_quantity: 1 };

      const mockDb = {
        query: async (text, params) => {
          assert.match(text, /DELETE FROM books WHERE id = \$1/i);
          assert.deepEqual(params, [3]);
          return { rows: [deletedRecord] };
        },
      };

      const result = await bookService.deleteBook(3, mockDb);
      assert.deepEqual(result, deletedRecord);
    });

    test('should throw 404 if book to delete does not exist', async () => {
      const mockDb = {
        query: async () => ({ rows: [] }),
      };

      await assert.rejects(
        async () => bookService.deleteBook(999, mockDb),
        (err) => err.statusCode === 404
      );
    });

    test('should throw 400 if id is invalid', async () => {
      const mockDb = { query: async () => ({ rows: [] }) };

      await assert.rejects(
        async () => bookService.deleteBook('abc', mockDb),
        (err) => err.statusCode === 400
      );
    });
  });
});
