import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";
import { query } from "./db";
import { Professor } from "./models/professors";
//ist bis jetzt nur chatgpt generiert... bin noch unzufrieden wie ein paar sachen gemacht wurden muss nochmal überarbeitet werden
//das script kümmert sich um den Port 3000 also die html die der nutzer sieht um die datenbank zu bearbeiten
const ADMIN_PORT = Number(process.env.ADMIN_PORT || 3000);
const app = express();

// public serving
app.use(cors());
app.use(bodyParser.json());
const publicPath = path.join(__dirname, "..", "src", "public");
app.use(express.static(publicPath));


// REST: list
app.get("/api/professors", async (req, res) => {
    try {
        const result = await query("SELECT * FROM professors ORDER BY id ASC");
        //TODO: loggen
        res.json(result.rows);
    } catch (err) {
        //TODO: loggen
        console.error(err);
        res.status(500).json({ error: "db error" });
    }
});

// REST: get single
app.get("/api/professors/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
        const result = await query("SELECT * FROM professors WHERE id = $1", [id]);//hier muss möglicherweise ein promiss hin, falls es probleme macht mit den threads
        if (result.rowCount === 0) return res.status(404).json({ error: "not found" });
        //TODO: loggen
        res.json(result.rows[0]);
    } catch (err) {
        //TODO: loggen
        console.error(err);
        res.status(500).json({ error: "db error" });
    }
});

// REST: create (also write command JSON to commands table)
app.post("/api/professors", async (req, res) => {
    const p: Professor = req.body;
    if (!p.firstname || !p.lastname) return res.status(400).json({ error: "firstname+lastname required" });
    try {
        const insert = await query(
            "INSERT INTO professors (firstname, lastname, email, chair) VALUES ($1,$2,$3,$4) RETURNING *",
            [p.firstname, p.lastname, p.email || null]
        );

        const created = insert.rows[0];

        // create JSON command and store in commands table
        const cmd = {
            action: "create",
            target: "professor",
            payload: created
        };
        await query("INSERT INTO commands (command) VALUES ($1)", [cmd]);
        //TODO: loggen
        res.status(201).json(created);
    } catch (err) {
        console.error(err);
        //TODO: loggen
        res.status(500).json({ error: "db error" });
    }
});

// REST: update
app.put("/api/professors/:id", async (req, res) => {
    const id = Number(req.params.id);
    const p: Professor = req.body;
    try {
        const upd = await query(
            "UPDATE professors SET firstname=$1, lastname=$2, email=$3, chair=$4 WHERE id=$5 RETURNING *",
            [p.firstname, p.lastname, p.email || null, id]
        );
        if (upd.rowCount === 0) return res.status(404).json({ error: "not found" });

        const updated = upd.rows[0];
        const cmd = {
            action: "update",
            target: "professor",
            payload: updated
        };
        await query("INSERT INTO commands (command) VALUES ($1)", [cmd]);
        //TODO: loggen
        res.json(updated);
    } catch (err) {
        console.error(err);
        //TODO: loggen
        res.status(500).json({ error: "db error" });
    }
});

// REST: delete
app.delete("/api/professors/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
        const del = await query("DELETE FROM professors WHERE id=$1 RETURNING *", [id]);
        if (del.rowCount === 0) return res.status(404).json({ error: "not found" });

        const deleted = del.rows[0];
        const cmd = { action: "delete", target: "professor", payload: { id: deleted.id } };
        await query("INSERT INTO commands (command) VALUES ($1)", [cmd]);
        //TODO: loggen
        res.json({ success: true, deleted });
    } catch (err) {
        console.error(err);
        //TODO: loggen
        res.status(500).json({ error: "db error" });
    }
});

// Serve the HTML file on root
app.get("/", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(ADMIN_PORT, () => {
    //TODO: loggen
    console.log(`Admin server listening on port ${ADMIN_PORT}`);
});
