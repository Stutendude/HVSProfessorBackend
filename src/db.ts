import { Pool } from "pg";

const useMock = process.env.MOCK_DB === "true";

let mockData: any[] = [];
let mockCommands: any[] = [];

if (useMock) {
    console.log("MOCK_DB aktiv — Datenbank wird nicht verwendet.");
}

let pool: Pool | null = null;

if (!useMock) {
    try {
        pool = new Pool({
            host: process.env.PGHOST,
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            database: process.env.PGDATABASE,
            port: Number(process.env.PGPORT || 5432),
        });
    } catch (e) {
        console.log("Konnte Postgres nicht initialisieren — starte im MOCK_DB Modus.");
    }
}

export async function query(text: string, params: any[] = []) {

    if (useMock || !pool) {
        // simulate minimal SQL
        if (text.startsWith("SELECT * FROM professors")) {
            return { rows: mockData };
        }

        if (text.startsWith("INSERT INTO professors")) {
            const newItem = {
                id: mockData.length + 1,
                firstname: params[0],
                lastname: params[1],
                email: params[2],
                chair: params[3],
            };
            mockData.push(newItem);
            return { rows: [newItem] };
        }

        if (text.startsWith("UPDATE professors")) {
            const id = params[4];
            const item = mockData.find((x) => x.id === id);
            if (!item) return { rowCount: 0, rows: [] };
            item.firstname = params[0];
            item.lastname = params[1];
            item.email = params[2];
            item.chair = params[3];
            return { rows: [item] };
        }

        if (text.startsWith("DELETE FROM professors")) {
            const id = params[0];
            const index = mockData.findIndex((x) => x.id === id);
            if (index === -1) return { rowCount: 0, rows: [] };
            const deleted = mockData.splice(index, 1)[0];
            return { rows: [deleted], rowCount: 1 };
        }

        if (text.startsWith("INSERT INTO commands")) {
            mockCommands.push(params[0]);
            return { rows: [] };
        }

        return { rows: [] };
    }

    // Real Postgres
    return pool.query(text, params);
}

/*
//finalle version des quellcodes, ohne mock

import { Pool } from "pg";

const pool = new Pool({
    host: process.env.PGHOST || "localhost",
    user: process.env.PGUSER || "profuser",
    password: process.env.PGPASSWORD || "profpass",
    database: process.env.PGDATABASE || "profdb",
    port: Number(process.env.PGPORT || 5432),
});

export async function query(text: string, params?: any[]) {
    return pool.query(text, params);
}

export default pool;*/
