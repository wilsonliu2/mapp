import express from "express";
import multer from "multer";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post("/upload-ai", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { count = 10 } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      const base64 = fs.readFileSync(file.path, { encoding: "base64" });

      const prompt = {
        role: "user",
        parts: [
          {
            text: `Generate summary and ${count} flashcards from this image of notes.`,
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

      fs.unlinkSync(file.path); // Clean up

      const output =
        result.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

      return res.json({ result: output });
    }

    // You can also include the DOCX/PDF parsing here as fallback
    return res.status(400).json({ error: "Unsupported file type" });
  } catch (err) {
    console.error("🤖 AI image scan failed:", err);
    return res
      .status(500)
      .json({ error: "AI generation failed", details: err.message });
  }
});

export default router;
