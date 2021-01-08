import http from 'http';
import ws from 'websocket';

const WebSocketServer = ws.server;

const server = http.createServer();
server.listen(8080);
console.log('server is listening of port 8080');

const wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on('request', function handleWebsocketRequest(request: ws.request) {
    const connection = request.accept('rpc-protocol', request.origin);

    connection.on('message', function handleMessage(message: any) {
        console.log('received message: ', message.utf8Data);
        connection.sendUTF('Hi, this the Websocket server!');
    });

    connection.on('close', function handleClose() {
        console.log('Client is disconnected');
    })
});