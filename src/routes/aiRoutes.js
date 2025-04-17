import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post("/generate-flashcards", async (req, res) => {
  try {
    const { text, count = 10 } = req.body;

    const prompt = `
You are an expert tutor.
Summarize the following notes in 3 bullet points.
Then generate ${count} flashcards in this format:

Q: question
A: answer

TEXT:
${text}
    `;

    const result = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const output =
      result.candidates[0]?.content?.parts?.[0]?.text || "No content returned.";

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
