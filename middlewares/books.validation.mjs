export const validateCreateBookData = (req, res, next) => {
  // 1) Books detail must contain tilte,author,genre,year,description
  if (!req.body.title) {
    return res.status(401).json({
      message: "Please give book's title detail",
    });
  }

  if (!req.body.author) {
    return res.status(401).json({
      message: "Please give book's author detail",
    });
  }

  if (!req.body.genre) {
    return res.status(401).json({
      message: "Please give book's genre detail",
    });
  }

  if (!req.body.year) {
    return res.status(401).json({
      message: "Please give book's year detail",
    });
  }

  if (!req.body.description) {
    return res.status(401).json({
      message: "Please give book's description detail",
    });
  }

  // 2) Books Description must not exceed 500 character
  if (req.body.description.length > 500) {
    return res.status(401).json({
      message: "Books' description must not exceed 500 character",
    });
  }

  //3) Validate typeof each input
  if (typeof req.body.title !== "string") {
    return res.status(400).json({
      message: "Book's title must be a string.",
    });
  }

  if (typeof req.body.author !== "string") {
    return res.status(400).json({
      message: "Book's author must be a string.",
    });
  }

  if (typeof req.body.genre !== "string") {
    return res.status(400).json({
      message: "Book's genre must be a string.",
    });
  }

  if (!Number.isInteger(req.body.year)) {
    return res.status(400).json({
      message: "Book's year must be an integer.",
    });
  }

  if (typeof req.body.description !== "string") {
    return res.status(400).json({
      message: "Book's description must be a string.",
    });
  }

  next();
};
