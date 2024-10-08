const WebSocket = require('ws');
const Y = require('yjs');
const {setupWSConnection} = require('y-websocket/bin/utils');

const wss = new WebSocket.Server({port: 1234});

const collabSketches = new Map();

const serverUrl = "ws://pce-server.glitch.me/1234";


wss.on('connection', (ws, req) => {
    console.log('New client connected');

    const params = req.url.split('/');
    console.log(params);
    const roomID = params[1];
    const userType = params[2];

    if (userType === 'host') {
        console.log('Host connected');

        let yDoc = collabSketches.get(roomID);
        if (!yDoc) {
            yDoc = new Y.Doc();
            console.log("Created new Y.Doc for sketch:", roomID);
            collabSketches.set(roomID, yDoc);
            console.log(yDoc.getText('codemirror'));
        } else {
            console.log("Existing document found, sending initial state to client.");
            // If an existing document is found, send its initial state to the client
            const encoder = Y.encodeStateAsUpdate(yDoc);
            ws.send(encoder);

            // Set up the connection with the document (yDoc)
            setupWSConnection(ws, req, {
                docName: roomID,
                gc: true
            }, yDoc);
        }
    } else if (userType === 'peer') {
        console.log('Peer connected');
        const yDoc = collabSketches.get(roomID);
        if (yDoc) {
            setupWSConnection(ws, req, {
                docName: roomID,
                gc: true
            }, yDoc);
        } else {
            ws.send({error: 'No document found for room:' + roomID});
            // console.error('No document found for room:', roomID);
        }
    }

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});


console.log('WebSocket server running on ws://localhost:1234');

function parseWebSocketURL(url) {
    try {
        // Split the path to extract the room name and host
        const pathParts = url.split('/').filter(Boolean);

        if (pathParts.length >= 2) {
            const roomName = pathParts[0];
            const host = pathParts[1];

            return {roomName, host};
        } else {
            throw new Error('Invalid URL format');
        }
    } catch (error) {
        console.error('Error parsing WebSocket URL:', error);
        return null;
    }
}

module.exports = {documents: collabSketches};
