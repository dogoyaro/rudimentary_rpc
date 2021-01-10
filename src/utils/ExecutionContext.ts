import Provider from './Provider';
import { Schema, Attribute } from '../contextA';

class ExecutionContext {
    provider: Provider
    request: string
    context: { [key: string]: { data: Data, schema: Schema } }

    constructor(provider: Provider) {
        this.provider = provider;
        this.context = {};
        this.request = '';
    }

    /**
     * 
     * @param request 
     */
    handleRequest(request: string): Response {
        let parsedRequest: Request;
        try {
            parsedRequest = this.parseRequest(request) as Request;
        } catch (error) {
            return {
                error: true,
                message: 'bad request',
            }
        }

        if (parsedRequest.init_fetch) {
            const { objectName = '' } = parsedRequest as Request;
            const { schema } = this.provider.getObject(objectName);

            this.context[objectName] = { ...this.provider.getObject(objectName) }
            return {
                schema,
            }

        }

        const result = this.executeRPCProcedure(parsedRequest);
        return {
            result,
        }
    }


    /**
     * ParseRequest
     * @param request 
     */
    parseRequest(request: string): object {
        const jsonObject = JSON.parse(request);
        const { objectName } = jsonObject;
        if (!objectName) {
            throw new Error('Invalid Request: Undefined object');
        }
        return jsonObject;
    }

    /**
     * 
     * @param request 
     */
    executeRPCProcedure(request: any): Response {
        try {
            const { type, objectName } = request;
            const result: Response = requestHandlers[type](request, this.context[objectName]);
            return result;
        } catch (error) {
            return {
                error: true,
                message: 'Error handling Request',
            }
        }

    }
}


const requestHandlers: { [type: string]: (request: Request, obj: { data: Data, schema: Schema }) => Response } = {
    attribute: (request, contextObject) => {
        const { attribute } = request as AttributeRequest;
        const { data, schema } = contextObject;
        const responseType = schema.attributes[attribute].type;
        const responseHandler = responseHandlers[responseType] || responseHandlers.default;

        const response = responseHandler(data[attribute]);
        return response;
    }
}


const responseHandlers: { [key: string]: (value: any) => Response } = {
    default: function defaultResponse(value: any) {
        return {
            result: value
        }
    }
}

interface Data {
    [key: string]: any
}

interface Request {
    objectName: string
    init_fetch?: true
    returnType: string
    attribute?: string
}

interface AttributeRequest {
    objectName: string
    init_fetch?: true
    returnType: string
    attribute: string
}

interface ErrorRPCResponse {
    error: true
    message: string
}

interface RPCResponse {
    result: any
}

interface SchemaResponse {
    schema: any
}

type Response = ErrorRPCResponse | RPCResponse | SchemaResponse

export default ExecutionContext;