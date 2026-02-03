const sqlite3 = require("sqlite3").verbose();
const path = require("path");

//laczenie sie z baza sqlLite
const db = new sqlite3.Database(path.join(__dirname, "bingo.db"), (err) => {
  if (err) {
    console.error("Database error:", err); // nie udalo sie polaczyc
  } else {
    console.log("Connected to SQLite"); // podlaczono do bazy
    createTables(); // automatycznie tworze tabele w bazie na startcie
  }
});

function createTables() {
  //tworzenie tabeli w sql dla uzytkownikow
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    )
  `);
  //tworzenie tabeli w sql dla gier
  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hostId TEXT NOT NULL,
      maxPlayers INTEGER DEFAULT 10,
      players TEXT DEFAULT '[]',
      status TEXT DEFAULT 'waiting',
      drawnNumbers TEXT DEFAULT '[]',
      createdAt INTEGER NOT NULL
    )
  `);
  //tworzenie tabeli w sql dla kart
  db.run(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      gameId TEXT NOT NULL,
      numbers TEXT NOT NULL,
      markedPositions TEXT DEFAULT '[[2,2]]',
      createdAt INTEGER NOT NULL
    )
  `);
  //tworzenie tabeli w sql dla zwyciezkow - historia wygranych
  db.run(`
    CREATE TABLE IF NOT EXISTS winners (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      winnerId TEXT NOT NULL,
      winnerName TEXT NOT NULL,
      winnerPattern TEXT,
      roundNumber INTEGER,
      wonAt INTEGER NOT NULL
    )
  `);
}

//owijanie w promisy zebym mogla uzyzc async await -> bo sql uzywa callbacks (dla ultawienia)

//dbRun - INSERT, UPDATE, DELETE (nie zwraca danych)
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

//dbGet - SELECT pojedynczego wiersza (zwraca obiekt lub undefined)
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

//dbGet - SELECT pojedynczego wiersza (zwraca obiekt lub undefined)
const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = { db, dbRun, dbGet, dbAll };

/*notes:
db.run -> zrob cos nie zwracaj nic (undefined)

db.get -> pobierz jeden wiersz (SELECT) -> zwróc obiekt z tym wierszem

d.all -> pobierz WSYZTSKIe wiersze -> zwraca tablice obiektów lub pusta tablice 
*/
