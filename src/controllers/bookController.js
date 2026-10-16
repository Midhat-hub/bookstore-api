const bookService = require('../services/bookService');

async function getBooks(req, res, next) {
  try {
    const db = req.app.locals.db;
    const books = await bookService.getAllBooks(db);
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
}

async function getBookById(req, res, next) {
  try {
    const db = req.app.locals.db;
    const book = await bookService.getBookById(req.params.id, db);
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
}

async function createBook(req, res, next) {
  try {
    const db = req.app.locals.db;
    const book = await bookService.createBook(req.body, db);
    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
}

async function updateBook(req, res, next) {
  try {
    const db = req.app.locals.db;
    const book = await bookService.updateBook(req.params.id, req.body, db);
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
}

async function deleteBook(req, res, next) {
  try {
    const db = req.app.locals.db;
    const book = await bookService.deleteBook(req.params.id, db);
    res.status(200).json({ message: 'Book deleted successfully', book });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
