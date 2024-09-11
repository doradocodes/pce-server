const WebSocket = require('ws');
const Y = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 1234 });

// Create a map to store Y documents for each room
const collabSketches = new Map();

// Set up the WebSocket connection handler
wss.on('connection', (ws, req) => {
    console.log('New client connected');

    // Extract the room name from the URL (e.g., ws://localhost:1234/my-room)
    const sketchName = new URL(req.url, 'http://localhost').pathname.slice(1);

    // Get or create a Y document for this room
    let yDoc = collabSketches.get(sketchName);
    if (!yDoc) {
        yDoc = new Y.Doc();
        collabSketches.set(sketchName, yDoc);
    }

    // Set up the WebSocket connection using y-websocket utility
    setupWSConnection(ws, req, {
        docName: sketchName,
        gc: true
    }, yDoc);

    // Handle disconnection
    ws.on('close', () => {
        console.log('Client disconnected');

        // Remove the document if no clients are left in the room
        if (yDoc.getMap('awareness').size === 0) {
            collabSketches.delete(sketchName);
        }
    });
});

console.log('WebSocket server running on ws://localhost:1234');

// You can export the documents map if needed
module.exports = { documents: collabSketches };
