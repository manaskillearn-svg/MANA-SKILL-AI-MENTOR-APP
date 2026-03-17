import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

// API Routes

// Check Configuration Status (for Admin)
app.get("/api/admin/config-status", (req, res) => {
  res.json({
    gemini: {
      apiKey: !!process.env.GEMINI_API_KEY
    },
    upi: {
      id: !!process.env.VITE_ADMIN_UPI_ID,
      name: !!process.env.VITE_ADMIN_UPI_NAME
    }
  });
});

export default app;
