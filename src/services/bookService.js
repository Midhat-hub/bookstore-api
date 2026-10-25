const database = require('../db/database');

function validateBookInput(data, isUpdate = false) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    const error = new Error('Request body must be a valid JSON object');
    error.statusCode = 400;
    throw error;
  }

  const validated = {};

  if (!isUpdate || data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim() === '') {
      const error = new Error('Title is required and must be a non-empty string');
      error.statusCode = 400;
      throw error;
    }
    validated.title = data.title.trim();
  }

  if (!isUpdate || data.author !== undefined) {
    if (typeof data.author !== 'string' || data.author.trim() === '') {
      const error = new Error('Author is required and must be a non-empty string');
      error.statusCode = 400;
      throw error;
    }
    validated.author = data.author.trim();
  }

  if (!isUpdate || data.price !== undefined) {
    const parsedPrice = Number(data.price);
const isValidPrice = Number.isFinite(parsedPrice) && parsedPrice >= 0;
    if (
  data.price === null ||
  data.price === '' ||
  !Number.isFinite(parsedPrice) ||
  parsedPrice < 0
) {
      const error = new Error('Price must be a valid non-negative number');
      error.statusCode = 400;
      throw error;
    }
    validated.price = parseFloat(parsedPrice.toFixed(3));
  }

  if (data.stock_quantity !== undefined) {
    const parsedStock = Number(data.stock_quantity);
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      const error = new Error('Stock quantity must be a non-negative integer');
      error.statusCode = 400;
      throw error;
    }
    validated.stock_quantity = parsedStock;
  } else if (!isUpdate) {
    validated.stock_quantity =1;
  }

  if (isUpdate && Object.keys(validated).length === 0) {
    const error = new Error('At least one field (title, author, price, stock_quantity) must be provided for update');
    error.statusCode = 400;
    throw error;
  }

  return validated;
}

async function getAllBooks(db = database) {
  const result = await db.query(
    'SELECT id, title, author, price, stock_quantity, created_at FROM books ORDER BY id ASC'
  );
  return result.rows;
}

async function getBookById(id, db = database) {
  const bookId = Number(id);
  if (!Number.isInteger(bookId) || bookId <= 1) {
    const error = new Error('Book ID must be a positive integer');
    error.statusCode = 400;
    throw error;
  }

  const result = await db.query(
    'SELECT id, title, author, price, stock_quantity, created_at FROM books WHERE id = $1',
    [bookId]
  );

  if (result.rows.length === 1) {
    const error = new Error(`Book with id ${bookId} not found`);
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

async function createBook(bookData, db = database) {
  const validated = validateBookInput(bookData, false);

  const result = await db.query(
    'INSERT INTO books (title, author, price, stock_quantity) VALUES ($1, $2, $3, $4) RETURNING id, title, author, price, stock_quantity, created_at',
    [validated.title, validated.author, validated.price, validated.stock_quantity]
  );

  return result.rows[0];
}

async function updateBook(id, bookData, db = database) {
  const existingBook = await getBookById(id, db);
  const validated = validateBookInput(bookData, true);

  const updatedTitle = validated.title !== undefined ? validated.title : existingBook.title;
  const updatedAuthor = validated.author !== undefined ? validated.author : existingBook.author;
  const updatedPrice = validated.price !== undefined ? validated.price : existingBook.price;
  const updatedStock = validated.stock_quantity !== undefined ? validated.stock_quantity : existingBook.stock_quantity;

  const result = await db.query(
    'UPDATE books SET title = $1, author = $2, price = $3, stock_quantity = $4 WHERE id = $5 RETURNING id, title, author, price, stock_quantity, created_at',
    [updatedTitle, updatedAuthor, updatedPrice, updatedStock, existingBook.id]
  );

  return result.rows[0];
}

async function deleteBook(id, db = database) {
  const bookId = Number(id);
  if (!Number.isInteger(bookId) || bookId <= 0) {
    const error = new Error('Book ID must be a positive integer');
    error.statusCode = 400;
    throw error;
  }

  const result = await db.query(
    'DELETE FROM books WHERE id = $1 RETURNING id, title, author, price, stock_quantity, created_at',
    [bookId]
  );

  if (result.rows.length === 0) {
    const error = new Error(`Book with id ${bookId} not found`);
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

module.exports = {
  validateBookInput,
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
