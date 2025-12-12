CREATE TABLE IF NOT EXISTS professors (
    id SERIAL PRIMARY KEY,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT,
    chair TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commands (
    id SERIAL PRIMARY KEY,
    command JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed BOOLEAN DEFAULT FALSE
);
