const express = require("express");

require("dotenv").config();

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    environment: process.env.ENVIRONMENT || "default",
  });
});

module.exports = app;
