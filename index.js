const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Welcome to the Mini Class Scheduler Server..!", status: "success" });
    res.status(200);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Scheduler Server running on port ${PORT}`);
});