const express = require("express");
const WebSocket = require("ws");
const { SpeechClient } = require("@google-cloud/speech");
const path = require("path");

// Path to your service account JSON file
// const SERVICE_ACCOUNT_PATH = path.join(__dirname, "Backend", "gen-lang-client-0596990601-235084b7274b.json");
const client = new SpeechClient({ keyFilename: "Backend\\gen-lang-client-0596990601-235084b7274b.json" });

const app = express();
const port = 5002;

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws) => {
    console.log("WebSocket connection established.");

    let recognizeStream;

    ws.on("message", (message) => {
        if (Buffer.isBuffer(message)) {
            if (recognizeStream) {
                recognizeStream.write(message);
            }
        } else {
            const data = JSON.parse(message.toString());
            if (data.event === "start") {
                console.log("Starting transcription...");
                recognizeStream = client
                    .streamingRecognize({
                        config: {
                            encoding: "LINEAR16",
                            sampleRateHertz: 16000,
                            languageCode: "en-US",
                        },
                        interimResults: true,
                    })
                    .on("error", (err) => {
                        console.error("Google Speech-to-Text Error:", err);
                        ws.send(JSON.stringify({ event: "error", error: err.message }));
                    })
                    .on("data", (data) => {
                        const transcription = data.results[0]?.alternatives[0]?.transcript || "";
                        console.log("Transcription:", transcription);
                        ws.send(JSON.stringify({ event: "transcription", transcript: transcription }));
                    });
            } else if (data.event === "stop" && recognizeStream) {
                recognizeStream.end();
                recognizeStream = null;
                console.log("Recognition stream closed.");
            }
        }
    });

    ws.on("close", () => {
        if (recognizeStream) {
            recognizeStream.end();
        }
        console.log("WebSocket connection closed.");
    });
});

// HTTP server to upgrade to WebSocket
const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
    });
});