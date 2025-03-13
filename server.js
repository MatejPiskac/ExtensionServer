const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

let devices = {}; // Store registered devices
let sessions = []; // Store active sessions

// Randomly generate readable names
const adjectives = ["Happy", "Fast", "Blue", "Red", "Cool", "Smart", "Lucky"];
const animals = ["Tiger", "Fox", "Eagle", "Lion", "Panda", "Hawk", "Dolphin"];

function generateDeviceName() {
    let baseName;
    let nameExists;
    let counter = 1;

    do {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];
        baseName = counter === 1 ? `${adj}${animal}` : `${adj}${animal}${counter}`;
        nameExists = Object.values(devices).some(device => device.name === baseName);
        counter++;
    } while (nameExists);

    return baseName;
}

// Register a device
app.post("/register", (req, res) => {
    const { deviceId } = req.body;

    if (!deviceId) {
        return res.status(400).json({ status: "error", message: "Missing deviceId" });
    }

    if (!devices[deviceId]) {
        const uniqueName = generateDeviceName();
        devices[deviceId] = { id: deviceId, name: uniqueName, inSession: false };
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
        const session = { device1: device1.id, device2: device2.id };
        
        sessions.push(session);
        devices[device1.id].inSession = true;
        devices[device2.id].inSession = true;

        console.log(`Session created: ${device1.name} <-> ${device2.name}`);
        res.json({ status: "session_created", session: { name1: device1.name, name2: device2.name } });
    } else {
        res.json({ status: "no_available_devices" });
    }
});

// Check session for a device
app.post("/check_session", (req, res) => {
    const { deviceId } = req.body;

    if (!deviceId || !devices[deviceId]) {
        return res.status(400).json({ status: "error", message: "Invalid deviceId" });
    }

    let session = sessions.find(s => s.device1 === deviceId || s.device2 === deviceId);

    if (session) {
        res.json({ status: "in_session", session });
    } else {
        res.json({ status: "no_session" });
    }
});

// Leave a session
app.post("/leave_session", (req, res) => {
    const { deviceId } = req.body;

    if (!deviceId || !devices[deviceId]) {
        return res.status(400).json({ status: "error", message: "Invalid deviceId" });
    }

    let sessionIndex = sessions.findIndex(s => s.device1 === deviceId || s.device2 === deviceId);

    if (sessionIndex !== -1) {
        let session = sessions[sessionIndex];

        // Mark devices as not in session
        devices[session.device1].inSession = false;
        devices[session.device2].inSession = false;

        // Remove session from list
        sessions.splice(sessionIndex, 1);

        console.log(`Session ended for: ${devices[session.device1].name} and ${devices[session.device2].name}`);
        return res.json({ status: "session_ended" });
    }

    res.json({ status: "no_session" });
});

// Start the server
app.listen(3000, () => console.log("Server running on port 3000"));
