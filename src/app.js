const express = require("express");

require("dotenv").config();

const facts = [
  "Octopuses have three hearts.",
  "Botanically, bananas are berries, but strawberries are not.",
  "A day on Venus is longer than a year on Venus.",
  "Wombat poop is cube-shaped.",
  "Oxford University is older than the Aztec Empire.",
  "Sharks have existed longer than trees.",
  "A group of flamingos is called a flamboyance.",
  "The Eiffel Tower grows up to about 15 cm taller in summer as the metal expands.",
  "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.",
  "A penguin at Edinburgh Zoo, Sir Nils Olav, holds a knighthood from the Norwegian King's Guard.",
];

function randomFact(facts) {
  const index = Math.floor(Math.random() * facts.length);
  return facts[index];
}

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    environment: process.env.ENVIRONMENT || "default",
  });
});

app.get("/fact", (req, res) => {
  res.json({ fact: randomFact(facts) });
});

module.exports = app;
