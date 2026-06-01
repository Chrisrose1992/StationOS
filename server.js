const express = require("express");
const path = require("path");
const postRoutes = require("./routes/post_route");
const getRoutes = require("./routes/get_routes");

const app = express();
const port = Number(process.env.SERVER_PORT) || 4000;
const host = process.env.SERVER_HOST || "127.0.0.1";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "pages"));

let command = {
    action: "start_generator",
};

app.use("/", getRoutes);
app.use("/", postRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get("/api/commands", (req, res) => {
    res.json(command);
});

app.post("/api/test", (req, res) => {
    console.log(req.body);
    res.sendStatus(204);
});

app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: "Internal server error" });
});

// Create Server
app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
    console.log("Press CTRL-C to stop");
}).on("error", (err) => {
    console.error(`Server error: ${err.message}`);
    process.exit(1);
});
