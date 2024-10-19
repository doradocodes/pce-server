const WebSocket = require('ws');
const Y = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');
const http = require('http');
const https = require("node:https");

const dev_env = 'http://localhost:1234';
const prod_env = 'https://pce-server.onrender.com/1234';

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

        // if (yDoc.getMap('awareness').size === 0) {
        //     collabSketches.delete(sketchName);
        //     console.log(`Room ${sketchName} deleted due to no active clients.`);
        // }
    });
});

console.log('WebSocket server running on ws://localhost:1234');

// Self-ping every 5 minutes to keep server alive
setInterval(() => {
    const serverUrl = process.env.NODE_ENV === 'production' ? prod_env : dev_env;
    console.log('serverUrl', serverUrl);
    const protocol = serverUrl.startsWith('https') ? https : http;
    protocol.get(serverUrl, (res) => {
        res.on('data', (chunk) => {
            console.log(`Self-ping response: ${chunk}`);
        });
    }).on('error', (err) => {
        console.error('Error pinging self:', err.message);
    });
}, 300000); // 5 minutes in milliseconds

module.exports = { documents: collabSketches };
