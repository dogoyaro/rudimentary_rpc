import ws, { connection } from 'websocket';

class Consumer {
    _connection: ws.connection
    _remoteObjects: object

    constructor(connection: ws.connection) {
        this._connection = connection;
        this._remoteObjects = {};
    }

    async getRemoteObject(objectName: string) {
        const connection = this._connection
        return new Promise(function (resolve, reject) {
            connection.sendUTF(JSON.stringify({
                objectName,
                init_fetch: true
            }));
            connection.on('message', function handleInitialFetch(message: ws.IMessage) {
                const messageBody = JSON.parse(message.utf8Data as string);
                if (messageBody.type == 'schema') {
                    const obj = Consumer.getObjectAPI(message.utf8Data as string, connection);
                    resolve(obj);
                }
            });
        });
    }

    static getObjectAPI(schemaResponse: string, connection: ws.connection) {
        console.log(JSON.parse(schemaResponse));
        const { schema } = JSON.parse(schemaResponse);
        const { service: objectName } = schema;
        const { attributes, methods } = schema;

        const objectAPI = {}
        Object.keys(attributes).forEach(function addAttributeProperty(attribute: string) {
            Object.defineProperty(objectAPI, attribute, {
                get: async function () {
                    return await propertyHandlers.attribute(objectName, attribute, connection);
                }
            })
        });
        Object.keys(methods).forEach(function addMethodProperty(method: string) {
            Object.defineProperty(objectAPI, method, {
                get: function () {
                    return async (...args: any[]) => propertyHandlers.method(objectName, method, args, connection);
                }
            })
        });
        console.log('object kkeys', Object.keys(objectAPI));

        return objectAPI;
    }
}


const propertyHandlers = {
    attribute: async function getAttribute(objectName: string, attribute: string, connection: ws.connection) {
        return new Promise((resolve, reject) => {
            const request = {
                objectName,
                attribute,
                type: 'attribute'
            };

            connection.sendUTF(JSON.stringify(request));
            connection.on('message', function handleGetAttribute(message: ws.IMessage) {
                console.log('Attribute fetched', message);
                const data = JSON.parse(message.utf8Data as string);
                const response = responseHandlers[data.type](data);
                resolve(response);
            })
        });
    },
    method: async function getMethod(objectName: string, method: string, args: any[], connection: ws.connection) {
        return new Promise((resolve, reject) => {
            const request = {
                objectName,
                type: 'method',
                method,
                args
            };

            connection.sendUTF(JSON.stringify(request));
            connection.on('message', function handleGetAttribute(message: ws.IMessage) {
                console.log('method call', message);
                const data = JSON.parse(message.utf8Data as string);
                const response = responseHandlers[data.type](data, objectName, connection);
                resolve(response)
            })
        })
    }
}

const responseHandlers: { [key: string]: any } = {
    property: (response: any) => {
        return response.value.result
    },

    pointer: (response: any, objectName: string, connection: ws.connection) => {
        return async function getPointerProperty(...args: any[]) {
            return new Promise((resolve, reject) => {
                const pointer = response._id;
                const request = {
                    type: 'pointer',
                    pointer,
                    objectName,
                    args,
                }
                connection.sendUTF(JSON.stringify(request));
                connection.on('message', function handleGetPointerResponse(message: ws.IMessage) {
                    console.log('pointer method call', message);
                    const data = JSON.parse(message.utf8Data as string);
                    const response = responseHandlers[data.type](data, objectName, connection);
                    resolve(response)
                });
        });
    }
}
}

export default Consumer;

export interface Attribute {
    [key: string]: {
        type: string
    }
}