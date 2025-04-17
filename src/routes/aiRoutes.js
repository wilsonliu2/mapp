import express from "express";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const router = express.Router();

router.post("/generate-flashcards", async (req, res) => {
  try {
    const { text, count = 10 } = req.body;

    const prompt = `
You are a tutor AI.
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
      result.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    res.json({ result: output });
  } catch (err) {
    console.error("AI generation error:", err);
    res
      .status(500)
      .json({ error: "AI generation failed", details: err.message });
  }
});

export default router;
