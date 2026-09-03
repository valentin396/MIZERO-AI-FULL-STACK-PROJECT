-- Reference schema — SQLAlchemy creates these automatically on first
-- run (see backend/app/main.py), this file documents the same
-- structure for anyone reading the database design directly.

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    profile_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(20) NOT NULL,          -- LOST | FOUND | RECOVERED | CLOSED
    category VARCHAR(50),
    title VARCHAR(200),
    description TEXT,
    brand VARCHAR(100),
    model VARCHAR(100),
    color VARCHAR(50),
    location VARCHAR(200),                -- real Rwandan district
    landmark VARCHAR(200),                -- sector / specific spot
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    event_date DATE,
    event_time TIME,
    image_url VARCHAR(500),
    image_hash VARCHAR(16),               -- perceptual hash (dHash)
    search_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    step VARCHAR(30) DEFAULT 'GREETING',
    draft TEXT DEFAULT '{}',
    item_id INTEGER REFERENCES items(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id),
    sender VARCHAR(20),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    lost_item_id INTEGER REFERENCES items(id),
    found_item_id INTEGER REFERENCES items(id),
    text_score FLOAT,
    location_score FLOAT,
    time_score FLOAT,
    image_score FLOAT,                    -- nullable: null when no photo to compare
    category_score FLOAT,
    final_score FLOAT,
    status VARCHAR(30) DEFAULT 'pending',  -- pending | confirmed | rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lost_item_id, found_item_id)
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    match_id INTEGER REFERENCES matches(id),
    title VARCHAR(200),
    message TEXT,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ownership_verifications (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id),
    user_id INTEGER REFERENCES users(id),
    question TEXT,
    expected_answer TEXT,
    user_answer TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
