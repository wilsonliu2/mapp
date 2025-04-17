import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-ai", upload.single("file"), async (req, res) => {
  const file = req.file;
  const { count = 10 } = req.body;

  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    let text = "";

    if (file.mimetype === "application/pdf") {
      const buffer = fs.readFileSync(file.path);
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const buffer = fs.readFileSync(file.path);
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    fs.unlinkSync(file.path); // Clean up temp file

    const prompt = `
You are a tutor AI.
Summarize the following notes in 3 bullet points.
Then generate ${count} flashcards in the format:

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
    console.error("Upload AI error:", err);
    res.status(500).json({ error: "Processing failed", details: err.message });
  }
});

export default router;
