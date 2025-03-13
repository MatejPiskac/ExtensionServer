const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

let devices = {}; // Store registered devices
let sessions = []; // Store active sessions

// Randomly generate readable names with uniqueness check
const adjectives = ["Happy", "Fast", "Blue", "Red", "Cool", "Smart", "Lucky"];
const animals = ["Tiger", "Fox", "Eagle", "Lion", "Panda", "Hawk", "Dolphin"];

function generateDeviceName() {
    let name;
    let count = 1;

    do {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];
        name = `${adj}${animal}${count > 1 ? count : ""}`;
        count++;
    } while (Object.values(devices).some(d => d.name === name)); // Ensure uniqueness

    return name;
}

// Register a device
app.post("/register", (req, res) => {
    const { deviceId } = req.body;

    if (!deviceId) {
        return res.status(400).json({ status: "error", message: "Missing deviceId" });
    }

    if (!devices[deviceId]) {
        devices[deviceId] = { id: deviceId, name: generateDeviceName(), inSession: false };
    }

    console.log(`Device registered: ${devices[deviceId].name}`);

    res.json({ status: "registered", device: devices[deviceId] });
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

        let session = { 
            device1: device1.id, 
            name1: device1.name, 
            device2: device2.id, 
            name2: device2.name 
        };

        sessions.push(session);

        // Mark devices as in session
        devices[device1.id].inSession = true;
        devices[device2.id].inSession = true;

        console.log(`Session created: ${session.name1} & ${session.name2}`);

        res.json({ status: "session_created", session });
    } else {
        res.json({ status: "no_available_devices" });
    }
});

// Check session for a device
app.post("/check_session", (req, res) => {
    const { deviceId } = req.body;
    let session = sessions.find(s => s.device1 === deviceId || s.device2 === deviceId);

    if (session) {
        res.json({ status: "in_session", session });
    } else {
        res.json({ status: "no_session" });
    }
});

// Leave session
app.post("/leave_session", (req, res) => {
    const { deviceId } = req.body;
    let session = sessions.find(s => s.device1 === deviceId || s.device2 === deviceId);

    if (session) {
        devices[session.device1].inSession = false;
        devices[session.device2].inSession = false;

        sessions = sessions.filter(s => s !== session);

        console.log(`Session ended for: ${devices[session.device1].name} & ${devices[session.device2].name}`);

        res.json({ status: "session_ended" });
    } else {
        res.json({ status: "no_session" });
    }
});

// Start the server
app.listen(3000, () => console.log("Server running on port 3000"));
