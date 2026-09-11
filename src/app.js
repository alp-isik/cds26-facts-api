const express = require("express");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        environment: "default"
    });
});

module.exports = app;
