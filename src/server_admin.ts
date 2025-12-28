import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";
import { connectMongo, Professors, Commands, toObjectId } from "./db";

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
    if(!Professors) {
        console.log(`MongoDB not found`);
        return res.status(404).json({error: "DB not found"});
    }else
        res.json(await Professors.find().toArray());
});



// REST: get single
app.get("/api/professors/:id", async (req, res) => {
    if(!Professors) {
        console.log(`MongoDB not found`);
        return res.status(404).json({error: "DB not found"});
    }

    const prof = await Professors.findOne({ _id: toObjectId(req.params.id) });
    if (!prof) return res.status(404).json({ error: "not found" });
    res.json(prof);
});


// REST: create (also write command JSON to commands table)
app.post("/api/professors", async (req, res) => {
    if(!Professors) {
        console.log(`MongoDB not found`);
        return res.status(404).json({error: "DB not found"});
    }

    const payload = req.body;

    const result = await Professors.insertOne(payload);

    const created = { _id: result.insertedId, ...payload };

    await Commands.insertOne({
        action: "create",
        target: "professor",
        payload: created,
        timestamp: new Date(),
    });

    res.status(201).json(created);
});


// REST: update
app.put("/api/professors/:id", async (req, res) => {
    if(!Professors) {
        console.log(`MongoDB not found`);
        return res.status(404).json({error: "DB not found"});
    }

    const id = toObjectId(req.params.id);

    const result = await Professors.findOneAndUpdate(
        { _id: id },
        { $set: req.body },
        { returnDocument: "after" }
    );

    if (!result || !result.value) return res.status(404).json({ error: "not found" });

    await Commands.insertOne({
        action: "update",
        target: "professor",
        payload: result.value,
        timestamp: new Date(),
    });

    res.json(result.value);
});


// REST: delete
app.delete("/api/professors/:id", async (req, res) => {
    if(!Professors) {
        console.log(`MongoDB not found`);
        return res.status(404).json({error: "DB not found"});
    }

    const id = toObjectId(req.params.id);

    const prof = await Professors.findOneAndDelete({ _id: id });
    if (!prof || !prof.value) return res.status(404).json({ error: "not found" });

    await Commands.insertOne({
        action: "delete",
        target: "professor",
        payload: { _id: id },
        timestamp: new Date(),
    });

    res.json({ success: true });
});


// Serve the HTML file on root
app.get("/", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(ADMIN_PORT, () => {
    //Mongo wird verbunden
    console.log(`waiting for MongoDB`);
    (async () => {
        await connectMongo();
        console.log(`Listening on Port ${ADMIN_PORT} with MongoDB`);
    })();
});
