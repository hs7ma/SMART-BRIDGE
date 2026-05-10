const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let latestData = {
  light: 0,
  bridgeStatus: "open",
  crowded: false,
  vibration: false,
  irEntry: false,
  irExit: false,
  timestamp: Date.now(),
};

let pendingCommand = { override: false, angle: 90 };

app.post("/api/data", (req, res) => {
  latestData = { ...req.body, timestamp: Date.now() };
  broadcast(latestData);
  res.json({ ok: true });
});

app.get("/api/command", (req, res) => {
  res.json(pendingCommand);
});

app.post("/api/override", (req, res) => {
  pendingCommand = {
    override: req.body.override,
    angle: req.body.angle || 90,
  };
  broadcast({ type: "command", ...pendingCommand });
  res.json({ ok: true });
});

app.get("/api/status", (req, res) => {
  res.json(latestData);
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "init", ...latestData }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Smart Bridge server running on port ${PORT}`);
});