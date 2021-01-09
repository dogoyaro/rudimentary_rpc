import http from 'http';
import ws from 'websocket';
import ExecutionContext from './utils/ExecutionContext';
import Provider from './utils/Provider';
import { getObjectProvider } from './contextA';

const WebSocketServer = ws.server;

const server = http.createServer();
server.listen(8080);
console.log('server is listening of port 8080');

const wsServer = new WebSocketServer({
    httpServer: server
});

function handleServiceRequest(provider: any, payload: Request): any {
    const { objectName, procedure: {
        method = '',
        attribute = '',
        args = [],
    } = {} } = payload;
    const service = provider.getObject(objectName);
    if (method) {
        return service[method](...args);
    }

    return service[attribute]
}
function sanitizeRequest(request: string) {
    return true;
}

function handleRemoteProcedureCall(utf8Data: string, provider: Provider): Response {
    const isValid = sanitizeRequest(utf8Data);
    let response: Response;

    if (!utf8Data || !isValid) {
        response = {
            error: true,
            message: 'bad request'
        }
        return response;
    }

    const payload = JSON.parse(utf8Data);
    const result = handleServiceRequest(provider, payload);

    response = {
        result,
    }

    return response;
}

wsServer.on('request', function handleWebsocketRequest(request: ws.request) {
    const connection = request.accept('rpc-protocol', request.origin);
    const provider = getObjectProvider();
    const context = new ExecutionContext(provider);

    connection.on('message', function handleMessage(data: ws.IMessage) {
        const { utf8Data: request = '' } = data;
        const result = context.handleRequest(request);
        connection.sendUTF(JSON.stringify(result));
        // const response: Response = handleRemoteProcedureCall(request, provider);
        // connection.sendUTF(JSON.stringify(response));
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