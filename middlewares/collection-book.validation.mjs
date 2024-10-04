export const validateCollectionBookData = (req, res, next) => {
  // 1) Collection Book detail must contain book_id
  if (!req.body.book_id) {
    return res.status(401).json({
      message: "Please give book_id",
    });
  }

  if (!Number.isInteger(req.body.book_id)) {
    return res.status(400).json({
      message: "Book_ID must be an integer.",
    });
  }
  next();
};
