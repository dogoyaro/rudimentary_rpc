#! /usr/bin/env node
import ws from 'websocket';
import Consumer from './utils/Consumer';
import contextB from './contexts/contextB';


const WebSocketClient = ws.client;
const client = new WebSocketClient();
client.on('connectFailed', function handleError(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function handleConnection(connection: ws.connection) {
    console.log('WebSocket client connected');
    connection.on('error', function handleError(error: Error) {
        console.log('Connection Error: ' + error.toString());
    });

    connection.on('close', function handleClose() {
        console.log('rpc-protocol connection closed');
    });

    initializeConsumer()

    async function initializeConsumer() { 
        if (connection.connected) {
            console.log('connection established');
            const consumer = new Consumer(connection);
            contextB(consumer);
        }
    }
});


client.connect('ws://localhost:8080/', 'rpc-protocol');