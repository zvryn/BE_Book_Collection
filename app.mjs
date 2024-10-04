import express from "express";
import bookRouter from "./routes/books.mjs";
import collectionRouter from "./routes/collections.mjs";

const app = express();
const port = 4000;

app.use(express.json());
app.use("/books", bookRouter);
app.use("/collections", collectionRouter);
app.get("/test", (req, res) => {
  return res.json("Server API is Working");
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
