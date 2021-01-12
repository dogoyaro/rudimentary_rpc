import http from 'http';
import ws from 'websocket';
import ExecutionContext from './utils/ExecutionContext';
import Provider from './utils/Provider';
import { getObjectProvider } from './contexts/contextA';

const WebSocketServer = ws.server;

const server = http.createServer();
server.listen(8080);
console.log('server is listening of port 8080');

const wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on('request', function handleWebsocketRequest(request: ws.request) {
    const connection = request.accept('rpc-protocol', request.origin);
    const provider = getObjectProvider();
    const context = new ExecutionContext(provider);

    connection.on('message', function handleMessage(data: ws.IMessage) {
        const { utf8Data: request = '' } = data;
        const result = context.handleRequest(request);
        connection.sendUTF(JSON.stringify(result));
    });

    connection.on('close', function handleClose() {
        console.log('Client is disconnected');
    })
});

interface ErrorRPCResponse {
    error: true
    message: string
}

interface RPCResponse {
    result: any
}

interface Procedure {
    method: string
    args: any[]
    attribute: string
}

interface Request {
    objectName: string
    procedure: Procedure
}

type Response = ErrorRPCResponse | RPCResponse