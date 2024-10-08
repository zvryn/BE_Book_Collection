import { Router } from "express";
import { validateCreateBookData } from "../middlewares/books.validation.mjs";
import connectionPool from "../utils/db.mjs";
import { protect } from "../middlewares/protect.mjs";

const bookRouter = Router();

bookRouter.use(protect);

//1.API for Adding a new book
bookRouter.post("/", [validateCreateBookData], async (req, res) => {
  const { title, author, genre, year, description } = req.body;
  const newBook = {
    title,
    author,
    genre,
    year,
    description,
    user_id: req.user.id,
    created_at: new Date(),
    updated_at: new Date(),
  };
  console.log(req.user);
  console.log(newBook);

  try {
    await connectionPool.query(
      `INSERT INTO books (title,author,genre,year,description,user_id)
         values ($1,$2,$3,$4,$5,$6)`,
      [
        newBook.title,
        newBook.author,
        newBook.genre,
        newBook.year,
        newBook.description,
        newBook.user_id, // user_id will be edited later when authentication completed
      ]
    );

    return res.status(201).json({
      message: "Added Book Successfully",
    });
  } catch (error) {
    console.error("Error executing query:", error);

    if (error.message.includes("database connection")) {
      return res.status(500).json({
        message:
          "Server could not add book because of a database connection error.",
        error: error.message,
      });
    } else if (error.message.includes("null value")) {
      return res.status(400).json({
        message: "Cannot insert null values into required fields.",
        error: error.message,
      });
    } else {
      return res.status(500).json({
        message: "An unexpected error occurred.",
        error: error.message,
      });
    }
  }
});

//2. API for View all books Can query by genre and year
bookRouter.get("/", async (req, res) => {
  let results;
  const genre = req.query.genre;
  const year = req.query.year ? parseInt(req.query.year) : null;
  try {
    results = await connectionPool.query(
      `SELECT * FROM books 
        WHERE 
        (genre = $1 or $1 is null or $1 = '')
        AND 
        (year = $2 or $2 is null)
  `,
      [genre, year]
    );
    return res.status(200).json({
      data: results.rows,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server could not find book because database connection",
      error: error.message,
    });
  }
});

//3. API for View specific book
bookRouter.get("/:bookId", async (req, res) => {
  const bookIdFromClient = req.params.bookId;
  try {
    const results = await connectionPool.query(
      `SELECT * FROM books WHERE book_id=$1`,
      [bookIdFromClient]
    );
    if (!results.rows[0]) {
      return res
        .status(404)
        .json({ message: "Server could not find a requested book" });
    } else {
      return res.status(200).json({ data: results.rows[0] });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Server could not find books because database connection",
      error: error.message,
    });
  }
});

//4. API for Edit a book
bookRouter.put("/:bookId", [validateCreateBookData], async (req, res) => {
  const bookIdFromClient = req.params.bookId;
  const updateBook = { ...req.body, updated_at: new Date() };

  try {
    // Ensure all required fields are present in the request body
    if (
      !updateBook.title ||
      !updateBook.author ||
      !updateBook.genre ||
      !updateBook.year ||
      !updateBook.description
    ) {
      return res.status(400).json({
        message:
          "All fields (title, author, genre, year, description) are required.",
      });
    }

    const result = await connectionPool.query(
      `UPDATE books
         SET title = $2,
             author = $3,
             genre = $4,
             year = $5,
             description = $6,
             updated_at = $7
         WHERE book_id = $1`,
      [
        bookIdFromClient,
        updateBook.title,
        updateBook.author,
        updateBook.genre,
        updateBook.year,
        updateBook.description,
        updateBook.updated_at,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Server could not find a requested book to update",
      });
    }

    return res.status(200).json({
      message: "Book updated successfully.",
    });
  } catch (error) {
    console.error("Error updating book:", error.message);
    return res.status(500).json({
      message: "Server could not update book because database connection",
      error: error.message,
    });
  }
});

//5. API for Delete a book
bookRouter.delete("/:bookId", async (req, res) => {
  const bookIdFromClient = req.params.bookId;

  try {
    const result = await connectionPool.query(
      `DELETE FROM books WHERE book_id = $1`,
      [bookIdFromClient]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Server could not find a requested book to delete",
      });
    }

    return res.status(200).json({
      message: "Book deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting book:", error.message); // Log the error for debugging
    return res.status(500).json({
      message: {
        message: "Server could not delete book because database connection",
      },
      error: error.message, // Include error message in the response for better debugging
    });
  }
});

export default bookRouter;
