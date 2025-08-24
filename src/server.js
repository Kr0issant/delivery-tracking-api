import express from "express";
import cors from "cors";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function readFile(fileName) {
    try {
        const jsonData = await fs.promises.readFile(path.join(__dirname, fileName), "utf8");
        return JSON.parse(jsonData);
    } catch (err) {
        console.error('Error reading file:', err);
        throw err;
    }
}

async function overwriteFile(fileName, data) {
    try {
        const jsonString = JSON.stringify(data, null, 2); // null, 2 for pretty-printing
        await fs.promises.writeFile(path.join(__dirname, fileName), jsonString);
    } catch (err) {
        console.error('Error writing file:', err);
        throw err;
    }
}

const app = express();
app.use(cors());  // CORS middleware

// API Authentication Middleware
app.use((req, res, next) => {
    if (req.method === "GET") {
        return next();  // Skip API key check for public GET endpoint
    }
    const apiKeyHeader = req.headers['x-api-key'];
    if (apiKeyHeader !== process.env.apiKey) {
        return res.status(401).send("Invalid API Key.");
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // Body Parser middleware

app.get("/track", async (req, res) => {
    let trackings = await readFile("trackings.json");
    const foundTracking = trackings.find(i => req.query.tracking_id === i.tracking_id);

    if (foundTracking) { res.status(200).send(foundTracking); }
    else { res.status(404).send("Cannot find entry with specified ID."); }
});

app.post("/track", async (req, res) => {
    let trackings = await readFile("trackings.json");
    const foundTracking = trackings.find(i => req.query.tracking_id === i.tracking_id);
    
    if (foundTracking) { res.status(409).send("Tracking with specified ID already exists."); }
    else { 
        trackings.push(req.body);
        await overwriteFile("trackings.json", trackings);
        res.status(200).send("Entry Created.");
    }
});

app.put("/track", async (req, res) => {
    let trackings = await readFile("trackings.json");
    const foundTracking = trackings.find(i => req.query.tracking_id === i.tracking_id);

    if (foundTracking) {
        const foundIndex = trackings.findIndex(item => item.tracking_id === req.query.tracking_id);

        Object.keys(req.body).forEach(key => {
            trackings[foundIndex][key] = req.body[key];
        });
        await overwriteFile("trackings.json", trackings);
        res.status(200).send(`Successfully updated ${Object.keys(req.body).length} values.`);
    }
    else { res.status(404).send("Cannot find entry with specified ID."); }
});

app.delete("/track", async (req, res) => {
    let trackings = await readFile("trackings.json");
    const foundTracking = trackings.find(i => req.query.tracking_id === i.tracking_id);

    if (foundTracking) {
        trackings.splice(trackings.findIndex(item => item.tracking_id === req.query.tracking_id), 1);
        await overwriteFile("trackings.json", trackings);
        res.status(200).send(`Successfully deleted entry with specified ID.`);
    }
    else { res.status(404).send("Cannot find entry with specified ID."); }
})

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});