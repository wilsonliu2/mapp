import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/generate-flashcards", async (req, res) => {
  try {
    const { text, count = 10 } = req.body;

    const model = genAI.getGenerativeModel({
      model: "models/gemini-pro",
    });

    const prompt = `
You are an expert tutor.
Summarize the following notes in 3 bullet points.
Then generate ${count} flashcards in this format:

Q: question
A: answer

TEXT:
${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    res.json({ result: output });
  } catch (err) {
    console.error("🔥 AI error:", err.message || err);
    res.status(500).json({
      error: "AI generation failed",
      details: err.message || "Unknown error",
    });
  }
});

export default router;
