const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

let devices = {}; // Store registered devices
let sessions = []; // Store active sessions

// Register a device
app.post("/register", (req, res) => {
    const { deviceId } = req.body;
    devices[deviceId] = { id: deviceId, inSession: false };
    res.json({ status: "registered" });
});

// Get available devices
app.get("/devices", (req, res) => {
    res.json({ devices: Object.values(devices) });
});

// Create a session
app.post("/create_session", (req, res) => {
    let availableDevices = Object.values(devices).filter(d => !d.inSession);
    if (availableDevices.length >= 2) {
        let [device1, device2] = availableDevices.slice(0, 2);
        sessions.push({ device1: device1.id, device2: device2.id });
        devices[device1.id].inSession = true;
        devices[device2.id].inSession = true;
        res.json({ status: "session_created", session: { device1: device1.id, device2: device2.id } });
    } else {
        res.json({ status: "no_available_devices" });
    }
});

// Start the server
app.listen(3000, () => console.log("Server running on port 3000"));
