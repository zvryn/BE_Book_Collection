export const validateCreateCollectionData = (req, res, next) => {
  // 1) Collection detail must contain Collection_name
  if (!req.body.collection_name) {
    return res.status(401).json({
      message: "Please give collection's name detail",
    });
  }

  // 2) Collection Name must not exceed 100 character
  if (req.body.collection_name.length > 100) {
    return res.status(401).json({
      message: "Collection' name must not exceed 100 character",
    });
  }

  //3) Validate typeof each collection name
  if (typeof req.body.collection_name !== "string") {
    return res.status(400).json({
      message: "Collection's name must be a string.",
    });
  }
  next();
};
