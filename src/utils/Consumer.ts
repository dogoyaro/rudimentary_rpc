import ws, { connection } from 'websocket';
import { v4 as uuidv4 } from 'uuid';

class Consumer {
    _connection: ws.connection
    _remoteObjects: object
    _messageHandlers: { [key: string]: (message: ws.IMessage) => void }

    constructor(connection: ws.connection) {
        this._connection = connection;
        this._remoteObjects = {};
        this._messageHandlers = {};
        this.initializeMessageListener();
    }

    async getRemoteObject(objectName: string) {
        const connection = this._connection

        const requestId = 'init';
        const schemaMessage = {
            objectName,
            _id: requestId,
            init_fetch: true,
        }

        return new Promise((resolve, reject) => {
            const handleInitialFetch = (message: ws.IMessage) => {
                const response = JSON.parse(message.utf8Data as string);
                if (response.type == 'error') {
                    reject(response.message);
                }
                const obj: { [key: string]: any } = this.getObjectAPI(message.utf8Data as string, connection);

                resolve(obj);
            }
            this.registerMessageHandler(requestId, handleInitialFetch);
            this.sendMessage(schemaMessage);
        });
    }

    getObjectAPI(schemaResponse: string, connection: ws.connection) {
        const { schema } = JSON.parse(schemaResponse);
        const { service: objectName } = schema;
        const { attributes, methods } = schema;

        const objectAPI = {}
        Object.keys(attributes).forEach((attribute: string) => {
            Object.defineProperty(objectAPI, attribute, {
                get: async () => {
                    const attributeMessage = propertyHandlers.attribute(objectName, attribute);

                    return new Promise((resolve) => {
                        this.registerMessageHandler(attributeMessage._id, handleGetAttribute);
                        this.sendMessage(attributeMessage);

                        function handleGetAttribute(message: ws.IMessage) {
                            const data = JSON.parse(message.utf8Data as string);
                            const response = responseHandlers[data.type](data);
                            resolve(response);
                        }
                    })
                }
            })
        });

        Object.keys(methods).forEach((method: string) => {
            Object.defineProperty(objectAPI, method, {
                get: () => {
                    return async (...args: any[]) => {
                        const methodMessage = propertyHandlers.method(objectName, method, args);

                        return new Promise((resolve) => {
                            this.registerMessageHandler(methodMessage._id, handleGetMethod);
                            this.sendMessage(methodMessage);

                            function handleGetMethod(message: ws.IMessage) {
                                const data = JSON.parse(message.utf8Data as string);
                                const response = responseHandlers[data.type](data, objectName, connection);
                                resolve(response)
                            }
                        })
                    }
                }
            })
        });

        return objectAPI;
    }

    registerMessageHandler(requestId: string, messageHandler: (message: ws.IMessage) => void) {
        this._messageHandlers[requestId] = messageHandler;
    }

    initializeMessageListener() {
        const connection = this._connection;
        const messageHandlers = this._messageHandlers;

        connection.on('message', function handleGetAttribute(message: ws.IMessage) {
            const { _id: requestId } = JSON.parse(message.utf8Data as string);
            messageHandlers[requestId] && messageHandlers[requestId](message);
        });
    }

    sendMessage(requestBody: object) {
        const connection = this._connection;
        connection.sendUTF(JSON.stringify(requestBody));
    }
}


const propertyHandlers = {
    attribute: function getAttribute(objectName: string, attribute: string) {
        const requestId = uuidv4();
        const request = {
            _id: requestId,
            objectName,
            attribute,
            type: 'attribute'
        };

        return request;
    },
    method: function getMethod(objectName: string, method: string, args: any[]) {
        const requestId = uuidv4();
        const request = {
            _id: requestId,
            objectName,
            type: 'method',
            method,
            args
        };

        return request;
    }
}

const responseHandlers: { [key: string]: any } = {
    property: (response: any) => {
        return response.value.result;
    },

    pointer: (response: any, objectName: string, connection: ws.connection) => {
        return async function getPointerProperty(...args: any[]) {
            return new Promise((resolve) => {
                const pointer = response._id;
                const requestId = uuidv4();
                const request = {
                    _id: requestId,
                    type: 'pointer',
                    pointer,
                    objectName,
                    args,
                }
                connection.sendUTF(JSON.stringify(request));
                connection.on('message', function handleGetPointerResponse(message: ws.IMessage) {
                    const data = JSON.parse(message.utf8Data as string);
                    if (data._id == requestId) {
                        const response = responseHandlers[data.type](data, objectName, connection);
                        resolve(response)
                    }
                });
            });
        }
    },

    error: (response: any) => {
        return response.message;
    },

    bigint: (response: any) => {
        return BigInt(response.value.result);
    }
}

export default Consumer;

export interface Attribute {
    [key: string]: {
        type: string
    }
}