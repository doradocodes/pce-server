const WebSocket = require('ws');
const Y = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');

const wss = new WebSocket.Server({ port: 1234 });

const collabSketches = new Map();

wss.on('connection', (ws, req) => {
    console.log('New client connected');

    // Extract the room name from the URL (e.g., ws://localhost:1234/my-room)
    const path = req.url.lastIndexOf('/');
    const sketchName = req.url.substring(path + 1);
    console.log('room name:', sketchName);

    let yDoc = collabSketches.get(sketchName);
    if (!yDoc) {
        yDoc = new Y.Doc();
        console.log("Created new Y.Doc for sketch:", sketchName);
        collabSketches.set(sketchName, yDoc);
        console.log(yDoc.getText('codemirror'));
    } else {
        console.log("Existing document found, sending initial state to client.");
        // If an existing document is found, send its initial state to the client
        const encoder = Y.encodeStateAsUpdate(yDoc);
        ws.send(encoder);

        // Set up the connection with the document (yDoc)
        setupWSConnection(ws, req, {
            docName: sketchName,
            gc: true
        }, yDoc);

        console.log('Active rooms:');
        for (const [key, value] of collabSketches) {
            console.log(`${key}`);
        }
    }
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server running on ws://localhost:1234');

module.exports = { documents: collabSketches };
