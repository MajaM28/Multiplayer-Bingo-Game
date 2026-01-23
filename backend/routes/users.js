const express = require("express");
const router = express.Router(); // express router -> mini aplikacja do grupowania endpointów
const users = []; //tymczasowe przechowywanie danych

router.post("/", (req, res) => {
  const { username, email, password } = req.body;
  const exists = users.find((u) => {
    return u.email === email;
  });

  if (!exists) {
    const newUser = {
      id: Date.now().toString(),
      username: username,
      email: email,
      password: password, //temporary!
      createdAt: Date.now(),
    };
    users.push(newUser);
    delete newUser.password;
    return res.status(201).json(newUser);
  } else {
    return res.status(400).json("User with that email already exists");
  }
});

module.exports = router; // eksportowanie router aby server mogl go zaimportowac
