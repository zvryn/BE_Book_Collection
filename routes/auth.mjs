import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connectionPool from "../utils/db.mjs";

const authRouter = Router();

// Register route
authRouter.post("/register", async (req, res) => {
  try {
    const { username, password, email, firstName, lastName, phoneNumber } =
      req.body;

    // Validate required fields
    if (!username || !password || !email) {
      return res
        .status(400)
        .json({ message: "Username, password, and email are required" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // SQL query to insert a new user
    const query = `
      INSERT INTO users 
      (username, password, email, first_name, last_name,phone_number, date_joined) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING user_id
    `;

    const values = [
      username,
      hashedPassword,
      email,
      firstName,
      lastName,
      phoneNumber,
      new Date(),
    ];

    // Execute the query
    const result = await connectionPool.query(query, values);

    // Send success response
    return res.status(201).json({
      message: "User has been created successfully",
      userId: result.rows[0].user_id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Login route
authRouter.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Query the PostgreSQL database for the user
    const query = "SELECT * FROM users WHERE username = $1";
    const values = [username];
    const result = await connectionPool.query(query, values);

    const user = result.rows[0]; // Get the first user

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate the password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, firstName: user.first_name, lastName: user.last_name },
      process.env.SECRET_KEY,
      {
        expiresIn: "15m", // Token expires in 15 minutes
      }
    );

    return res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default authRouter;
