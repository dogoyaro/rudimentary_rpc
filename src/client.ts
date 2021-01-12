#! /usr/bin/env node
import ws from 'websocket';
import Consumer from './utils/Consumer';


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
            const result: any = await consumer.getRemoteObject('taskObject');
            const operation = await result.operationFactory();
            console.log('the operation value', await operation());

            console.log('the operation value: ', await result.operation(2, 3));
            console.log('the name value: ', await result.name);
        }
    }
});


client.connect('ws://localhost:8080/', 'rpc-protocol');