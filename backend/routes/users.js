const express = require("express");
const router = express.Router(); // express router -> mini aplikacja do grupowania endpointów
const { dbRun, dbGet, dbAll } = require("../database/db");
const bcrypt = require("bcrypt");

//rejestracja -> tworzenie nowego usera
router.post("/", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const exists = await dbGet("SELECT * FROM users WHERE email = ?", [email]);
    if (exists) {
      return res.status(400).json("User with that email already exists");
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds); //freecodecamp tak mowi

    const newUser = {
      id: Date.now().toString(),
      username: username,
      email: email,
      password: hashedPassword,
      createdAt: Date.now(),
    };
    await dbRun(
      "INSERT INTO users (id, username, email, password, createdAt) VALUES (?, ?, ?, ?, ?)",
      [
        newUser.id,
        newUser.username,
        newUser.email,
        newUser.password,
        newUser.createdAt,
      ],
    );

    delete newUser.password;
    return res.status(201).json(newUser);
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json("Server error");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await dbGet("SELECT * FROM users WHERE email = ?", [email]);

    if (!user) {
      return res.status(401).json("No user with that email exists");
    }

    const isCorrect = await bcrypt.compare(password, user.password);

    if (!isCorrect) {
      return res.status(401).json("Password is incorrect");
    }

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
    return res.json({
      message: "Login successful",
      user: userResponse,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json("Server error");
  }
});

router.post("/logout", (req, res) => {
  return res.json("Logout successful");
});

router.get("/", async (req, res) => {
  try {
    const allUsers = await dbAll(
      "SELECT id, username, email, createdAt FROM users",
    );

    return res.json(allUsers);
  } catch (err) {
    console.error("Get all users error:", err);
    return res.status(500).json("Server error");
  }
});

//get dane uzytkownika
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id; // id nie przychodzi z posta (body) -> pochoddzi z params (dane z url)

    const found = await dbGet(
      "SELECT id, username, email, createdAt FROM users WHERE id = ?", //pobieramy bez hasła, bo nie chcemy zwracac hasla do innnych
      [id],
    );

    if (!found) {
      return res.status(404).json("No such user found");
    }

    return res.status(200).json(found); // 200 dla get -> 201 dla post
  } catch (err) {
    console.error("Get  one user error:", err);
    return res.status(500).json("Server error");
  }
});

//update dane uzytownika -> aktualizacja
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const exists = await dbGet("SELECT * FROM users WHERE id = ?", [id]);
    if (!exists) {
      return res.status(404).json("No such user found");
    }
    const { username, password } = req.body;
    await dbRun("UPDATE users SET username = ?, password = ? WHERE id = ?", [
      username || exists.username,
      password || exists.password,
      id,
    ]); //updatujemy dane , jak nie zosatły podane to są undefined wiec zosatja te co byly oryginalnie (w exists), nic to nie zwraca (bo to run)
    const updated = await dbGet(
      "SELECT id, username, email, createdAt FROM users WHERE id = ?",
      [id],
    ); // trzeba pobrac dane jeszcze raz zeby je zwrocic juz z nowymi wartosciami

    return res.status(200).json(updated);
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json("Server error");
  }
});

//usuwanie dane uzytkowanika -> delete

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const exists = await dbGet("SELECT * FROM users WHERE id = ?", [id]);
    if (!exists) {
      return res.status(404).json("No such user found");
    }

    await dbRun("DELETE FROM users WHERE id = ?", [id]);
    return res.status(200).json("User deleted");
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json("Server error");
  }
});

module.exports = router; // eksportowanie router aby server mogl go zaimportowac
