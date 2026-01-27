const express = require("express");
const router = express.Router(); // express router -> mini aplikacja do grupowania endpointów
const cards = [];

function generateBingoCard() {
  const ranges = [
    [1, 15], //B
    [16, 30], //I
    [31, 45], //N
    [46, 60], //G
    [61, 75], //O
  ];
  const singleCard = [];

  for (let row = 0; row < 5; row++) {
    const rowNum = [];

    for (let col = 0; col < 5; col++) {
      if (row == 2 && col == 2) {
        rowNum.push("FREE SPACE");
        continue;
      }

      const [min, max] = ranges[col];
      let randomNum;

      do {
        randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      } while (singleCard.some((r) => r[col] === randomNum));

      rowNum.push(randomNum);
    }
    singleCard.push(rowNum);
  }
  return singleCard;
}
//post(create), read(get), put(update), delete(delete)
router.post("/", (req, res) => {
  const { userId, gameId } = req.body;
  const newCard = {
    id: Date.now().toString(),
    userId,
    gameId,
    numbers: generateBingoCard(),
    markedPositions: [[2, 2]],
    createdAt: new Date(),
  };
  cards.push(newCard);
  return res.status(201).json(newCard);
});

router.get("/", (req, res) => {
  const { userId, gameId } = req.query; //parametry z URL

  let filtered = cards;

  if (userId) {
    filtered = filtered.filter((c) => {
      return c.userId === userId;
    });
  }

  if (gameId) {
    filtered = filtered.filter((c) => {
      return c.gameId === gameId;
    });
  }

  return res.json(filtered);
});

router.get("/:id", (req, res) => {
  const id = req.params.id;
  const found = cards.find((c) => {
    return c.id === id;
  });

  if (!found) {
    return res.status(404).json("No such card found");
  } else {
    return res.status(201).json(found);
  }
});

//ogólny update
router.put("/:id", (req, res) => {
  const id = req.params.id;
  const cardIndex = cards.findIndex((c) => {
    return c.id === id;
  });
  if (cardIndex === -1) {
    return res.status(404).json("No such card found");
  } else {
    cards[cardIndex] = {
      ...cards[cardIndex],
      ...req.body,
    };
    return res.status(200).json(cards[cardIndex]);
  }
});

router.delete("/:id", (req, res) => {
  const id = req.params.id;
  const cardIndex = cards.findIndex((c) => {
    return c.id === id;
  });
  if (cardIndex === -1) {
    return res.status(404).json("No such card found");
  } else {
    cards.splice(cardIndex, 1); // modyfikuje a nie usuwam
    return res.status(200).json("Card deleted");
  }
});

module.exports = router;
