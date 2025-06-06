const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./videos.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    url TEXT,
    uploader TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

module.exports = db;
