#! /usr/bin/env node
import ws from 'websocket';
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

    connection.on('message', function handleMessage(message: ws.IMessage) {
        if (message.type === 'utf8') {
            console.log('Received: ' + message.utf8Data);
        }
    });
    sendNumber()

    function sendNumber() {
        if (connection.connected) {
            const request = {
                objectName: 'taskObject',
                procedure: {
                    method: 'operation',
                    args: [1, 2],
                    attribute: 'name'
                }
            }
            connection.sendUTF(JSON.stringify(request));
            setTimeout(sendNumber, 1000);
        }
    }
});


client.connect('ws://localhost:8080/', 'rpc-protocol');
