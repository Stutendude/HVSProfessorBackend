import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { connectMongo, Professors, Commands, toObjectId } from "./db";

const ADMIN_PORT = Number(process.env.ADMIN_PORT || 3000);
const app = express();

/* =========================
   Middleware
========================= */
app.use(cors());
app.use(bodyParser.json());

const publicPath = path.join(__dirname, "..", "src", "public");
app.use(express.static(publicPath));

/* =========================
   Helper
========================= */
function mapProfessor(p: any) {
    return {
        id: p._id.toString(),
        firstname: p.first,
        lastname: p.last,
        email: p.email ?? ""
    };
}

/* =========================
   REST API
========================= */

// GET all
app.get("/api/professors", async (_req, res) => {
    const list = await Professors.find().toArray();
    res.json(list.map(mapProfessor));
});

// GET one
app.get("/api/professors/:id", async (req, res) => {
    const prof = await Professors.findOne({
        _id: toObjectId(req.params.id),
    });

    if (!prof) {
        return res.status(404).json({ error: "not found" });
    }

    res.json(mapProfessor(prof));
});

// CREATE
app.post("/api/professors", async (req, res) => {
    const payload = {
        first: req.body.first,
        last: req.body.last,
        email: req.body.email,
    };

    const result = await Professors.insertOne(payload);

    const created = { _id: result.insertedId, ...payload };

    await Commands.insertOne({
        action: "create",
        target: "professor",
        payload: created,
        timestamp: new Date(),
    });

    res.status(201).json(mapProfessor(created));
});

// UPDATE
app.put("/api/professors/:id", async (req, res) => {
    const result = await Professors.findOneAndUpdate(
        { _id: toObjectId(req.params.id) },
        { $set: req.body },
        { returnDocument: "after" }
    );

    if (!result || !result.value) {
        return res.status(404).json({ error: "not found" });
    }

    await Commands.insertOne({
        action: "update",
        target: "professor",
        payload: result.value,
        timestamp: new Date(),
    });

    res.json(mapProfessor(result.value));
});

// DELETE
app.delete("/api/professors/:id", async (req, res) => {
    const result = await Professors.findOneAndDelete({
        _id: toObjectId(req.params.id),
    });

    if (!result || !result.value) {
        return res.status(404).json({ error: "not found" });
    }

    await Commands.insertOne({
        action: "delete",
        target: "professor",
        payload: { _id: req.params.id },
        timestamp: new Date(),
    });

    res.json({ success: true });
});

/* =========================
   HTML Root
========================= */
app.get("/", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});

/* =========================
   Server Startup
========================= */
const server = http.createServer(app);

server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
        console.error(`Port ${ADMIN_PORT} already in use`);
    } else {
        console.error("Server error:", err);
    }
    process.exit(1);
});

(async () => {
    console.log("waiting for MongoDB");
    await connectMongo();
    console.log("Connected to MongoDB Replica Set");

    server.listen(ADMIN_PORT, () => {
        console.log(`Admin server listening on port ${ADMIN_PORT}`);
    });
})();
