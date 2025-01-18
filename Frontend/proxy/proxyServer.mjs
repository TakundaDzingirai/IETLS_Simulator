import express from "express";
import bodyParser from "body-parser";
import { createClient } from "@deepgram/sdk";

const app = express();
const port = 5002;

// Initialize Deepgram with your API key
const deepgram = createClient("063c5e5e646494e184c583b05183f2bcaddcf1ac");

app.use(bodyParser.raw({ type: "audio/webm", limit: "50mb" }));

app.post("/transcribe", async (req, res) => {
  try {
    const audioBuffer = req.body;

    // Send the audio to Deepgram for transcription
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      { model: "nova", punctuate: true }
    );

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(result);
  } catch (error) {
    console.error("Error during transcription:", error.message);
    res.status(500).json({ error: "Failed to process transcription" });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
