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
        })
        console.log('object kkeys', Object.keys(objectAPI));

        return objectAPI;
    }
}


const propertyHandlers = {
    attribute: async function getAttribute(objectName: string, attribute: string, connection: ws.connection) {
        return new Promise((resolve, reject) => {
            const request = {
                objectName,
                type: 'attribute',
                attribute: attribute
            };

            connection.sendUTF(JSON.stringify(request));
            connection.on('message', function handleGetAttribute(message: ws.IMessage) {
                console.log('Attribute fetched', message);
                const data = JSON.parse(message.utf8Data as string);
                if (data.type == "property") {
                    const result = data.result.result;
                    resolve(result);
                }
            })
        });
    }
}

export default Consumer;

// const consumer = new Consumer();
// const object = await consumer.getRemoteObject('taskObject')
// const name = await object.name;

export interface Attribute {
    [key: string]: {
        type: string
    }
}