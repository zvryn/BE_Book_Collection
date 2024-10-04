import { Router } from "express";
import { validateCreateCollectionData } from "../middlewares/collection.validation.mjs";
import connectionPool from "../utils/db.mjs";
import { validateCollectionBookData } from "../middlewares/collection-book.validation.mjs";
import { protect } from "../middlewares/protect.mjs";

const collectionRouter = Router();
collectionRouter.use(protect);
//6. API for Adding a new Collection
collectionRouter.post("/", [validateCreateCollectionData], async (req, res) => {
  const { user_id, collection_name } = req.body;
  const newCollection = {
    user_id,
    collection_name,
    created_at: new Date(),
    updated_at: new Date(),
  };

  console.log(newCollection);

  try {
    await connectionPool.query(
      `INSERT INTO collections (user_id,collection_name)
         values ($1,$2)`,
      [
        1, // user_id will be edited later when authentication completed
        newCollection.collection_name,
      ]
    );

    return res.status(201).json({
      message: "Added Collection Successfully",
    });
  } catch (error) {
    console.error("Error executing query:", error);

    if (error.message.includes("database connection")) {
      return res.status(500).json({
        message:
          "Server could not add collection because of a database connection error.",
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

//7. API for Adding a book to collection
collectionRouter.post(
  "/:collectionId/books",
  [validateCollectionBookData],
  async (req, res) => {
    const { collectionId } = req.params; // รับ collectionId จาก URL
    const { book_id } = req.body; // รับ book_id จาก body ของ request

    if (!collectionId || !book_id) {
      return res
        .status(400)
        .json({ message: "Invalid collection_id or book_id" });
    }

    try {
      // ตรวจสอบว่าหนังสือมีอยู่ในระบบก่อน
      const bookExistsResult = await connectionPool.query(
        "SELECT * FROM books WHERE book_id = $1",
        [book_id]
      );
      if (bookExistsResult.rows.length === 0) {
        return res.status(404).json({ message: "Book not found" });
      }

      // ตรวจสอบว่า collection มีอยู่หรือไม่
      const collectionExistsResult = await connectionPool.query(
        "SELECT * FROM collections WHERE collection_id = $1",
        [collectionId]
      );
      if (collectionExistsResult.rows.length === 0) {
        return res.status(404).json({ message: "Collection not found" });
      }

      // ตรวจสอบว่าหนังสือนั้นมีอยู่ใน collection แล้วหรือไม่
      const bookInCollectionResult = await connectionPool.query(
        "SELECT * FROM collection_books WHERE collection_id = $1 AND book_id = $2",
        [collectionId, book_id]
      );
      if (bookInCollectionResult.rows.length > 0) {
        return res
          .status(409)
          .json({ message: "Book already exists in this collection" });
      }

      // เพิ่มหนังสือเข้า collection
      await connectionPool.query(
        `INSERT INTO collection_books (collection_id, book_id, added_at)
         VALUES ($1, $2, $3)`,
        [collectionId, book_id, new Date()]
      );

      return res.status(201).json({
        message: "Added Book to Collection Successfully",
      });
    } catch (error) {
      console.error("Error adding book to collection:", error);
      return res.status(500).json({
        message:
          "Failed to add book to the collection. Please try again later.",
      });
    }
  }
);

//8. API for Delete a book from collection
collectionRouter.delete("/:collectionId/books/:bookId", async (req, res) => {
  const { collectionId, bookId } = req.params; // รับ collectionId และ bookId จาก URL

  if (!collectionId || !bookId) {
    return res
      .status(400)
      .json({ message: "Invalid collection_id or book_id" });
  }

  try {
    // ตรวจสอบว่าหนังสือมีอยู่ใน collection หรือไม่
    const bookInCollectionResult = await connectionPool.query(
      "SELECT * FROM collection_books WHERE collection_id = $1 AND book_id = $2",
      [collectionId, bookId]
    );
    if (bookInCollectionResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Book not found in this collection" });
    }

    // ลบหนังสือออกจาก collection
    await connectionPool.query(
      "DELETE FROM collection_books WHERE collection_id = $1 AND book_id = $2",
      [collectionId, bookId]
    );

    return res.status(200).json({
      message: "Book removed from collection successfully",
    });
  } catch (error) {
    console.error("Error deleting book from collection:", error);
    return res.status(500).json({
      message:
        "Failed to remove book from the collection. Please try again later.",
    });
  }
});

//9. API for View all collections
collectionRouter.get("/", async (req, res) => {
  try {
    // Query to retrieve all collections from the database
    const collectionsResult = await connectionPool.query(
      "SELECT * FROM collections"
    );

    if (collectionsResult.rows.length === 0) {
      return res.status(404).json({ message: "No collections found" });
    }

    // Respond with the list of collections
    return res.status(200).json({
      message: "Collections retrieved successfully",
      collections: collectionsResult.rows,
    });
  } catch (error) {
    console.error("Error retrieving collections:", error);
    return res.status(500).json({
      message: "Failed to retrieve collections. Please try again later.",
      error: error.message,
    });
  }
});

//10. API for View specific collection
collectionRouter.get("/:collectionId", async (req, res) => {
  const { collectionId } = req.params; // Get collectionId from the URL

  try {
    // Query to retrieve the specific collection by collectionId
    const collectionResult = await connectionPool.query(
      "SELECT * FROM collections WHERE collection_id = $1",
      [collectionId]
    );

    // Check if the collection was found
    if (collectionResult.rows.length === 0) {
      return res.status(404).json({ message: "Collection not found" });
    }

    // Return the collection details
    return res.status(200).json({
      message: "Collection retrieved successfully",
      collection: collectionResult.rows[0],
    });
  } catch (error) {
    console.error("Error retrieving the collection:", error);
    return res.status(500).json({
      message: "Failed to retrieve the collection. Please try again later.",
      error: error.message,
    });
  }
});

//11. API for Edit collection
collectionRouter.put(
  "/:collectionId",
  [validateCreateCollectionData],
  async (req, res) => {
    const { collectionId } = req.params; // Get collectionId from the URL
    const { collection_name } = req.body; // Get the new name from the request body

    if (!collection_name || typeof collection_name !== "string") {
      return res
        .status(400)
        .json({ message: "Invalid name. Please provide a valid string." });
    }

    try {
      // Check if the collection exists
      const collectionResult = await connectionPool.query(
        "SELECT * FROM collections WHERE collection_id = $1",
        [collectionId]
      );

      if (collectionResult.rows.length === 0) {
        return res.status(404).json({ message: "Collection not found" });
      }

      // Update the collection's name
      await connectionPool.query(
        "UPDATE collections SET collection_name = $1 WHERE collection_id = $2",
        [collection_name, collectionId]
      );

      return res.status(200).json({
        message: "Collection updated successfully",
        updatedCollection: {
          id: collectionId,
          collection_name,
        },
      });
    } catch (error) {
      console.error("Error updating the collection:", error);
      return res.status(500).json({
        message: "Failed to update the collection. Please try again later.",
        error: error.message,
      });
    }
  }
);

//12. API for Delete collection
collectionRouter.delete("/:collectionId", async (req, res) => {
  const { collectionId } = req.params; // Get collectionId from the URL

  try {
    // Check if the collection exists
    const collectionResult = await connectionPool.query(
      "SELECT * FROM collections WHERE collection_id = $1",
      [collectionId]
    );

    if (collectionResult.rows.length === 0) {
      return res.status(404).json({ message: "Collection not found" });
    }

    // Optionally, you can delete associated books in the collection (if required)
    await connectionPool.query(
      "DELETE FROM collection_books WHERE collection_id = $1",
      [collectionId]
    );

    // Delete the collection itself
    await connectionPool.query(
      "DELETE FROM collections WHERE collection_id = $1",
      [collectionId]
    );

    return res.status(200).json({
      message: "Collection deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting the collection:", error);
    return res.status(500).json({
      message: "Failed to delete the collection. Please try again later.",
      error: error.message,
    });
  }
});

//13. API for viwe books in collection
collectionRouter.get("/:collectionId/books", async (req, res) => {
  const { collectionId } = req.params; // Get collectionId from the URL

  try {
    // Query to retrieve books in the specified collection
    const booksResult = await connectionPool.query(
      `
        SELECT b.book_id AS book_id, b.title, b.author, b.genre, b.year
        FROM books b
        INNER JOIN collection_books cb ON b.book_id = cb.book_id
        WHERE cb.collection_id =$1
      `,
      [collectionId]
    );

    // Check if there are any books in the collection
    if (booksResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No books found in this collection" });
    }

    // Return the list of books in the collection
    return res.status(200).json({
      message: "Books retrieved successfully",
      books: booksResult.rows,
    });
  } catch (error) {
    console.error("Error retrieving books in the collection:", error);
    return res.status(500).json({
      message:
        "Failed to retrieve books in the collection. Please try again later.",
      error: error.message,
    });
  }
});

export default collectionRouter;
