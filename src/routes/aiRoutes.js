import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import { default as pdfParse } from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import express from "express";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-ai", upload.single("file"), async (req, res) => {
  const file = req.file;
  const { count = 2 } = req.body;

  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    let text = "";

    // ✅ Handle PDF
    if (file.mimetype === "application/pdf") {
      const buffer = fs.readFileSync(file.path);
      const data = await pdfParse(buffer);
      text = data.text;
    }

    // ✅ Handle DOCX
    else if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const buffer = fs.readFileSync(file.path);
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    // ✅ Handle Image (JPEG/PNG)
    else if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      const base64 = fs.readFileSync(file.path, { encoding: "base64" });

      const prompt = {
        role: "user",
        parts: [
          {
            text: `Generate summary and ${count} flashcards from this image of handwritten notes.`,
          },
          {
            inlineData: {
              mimeType: file.mimetype,
              data: base64,
            },
          },
        ],
      };

      const result = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: [prompt],
      });

      const output =
        result.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

      fs.unlinkSync(file.path); // Clean up

      return res.json({ result: output });
    }

    // ❌ Not a supported type
    else {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Unsupported file type" });
    }

    // If it's PDF or DOCX, send this prompt
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

    fs.unlinkSync(file.path); // Clean up

    res.json({ result: output });
  } catch (err) {
    console.error("Upload AI error:", err);
    res.status(500).json({ error: "Processing failed", details: err.message });
  }
});

export default router;
