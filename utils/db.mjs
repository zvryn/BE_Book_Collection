import pkg from "pg";

const { Pool } = pkg;

// Database configuration
const connectionPool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "book_collection_database",
  password: "techup1234",
  port: 5432, // Default PostgreSQL port
});

export default connectionPool;
