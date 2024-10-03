import express from "express";
import connectionPool from "./utils/db.mjs";

const app = express();
const port = 4000;

app.use(express.json());

app.get("/test", (req, res) => {
  return res.json("Server API is Working");
});

app.post("/books", async (req, res) => {
  //Logic for adding book into books database
  // 1) Access data in body from req.body
  const newBook = {
    ...req.body,
    created_at: new Date(),
    updated_at: new Date(),
  };
  // 2) Query to insert by connection pool
  await connectionPool.query(
    `INSERT INTO books (title,author,genre,year,description,user_id)
    values ($1,$2,$3,$4,$5,$6)`,
    [
      newBook.title,
      newBook.author,
      newBook.genre,
      newBook.year,
      newBook.description,
      1, // user_id will be edited later when authentication completed
    ]
  );
  // 3) Return response and handling error
  return res.status(201).json({
    message: "Added Book Successfully",
  });
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
