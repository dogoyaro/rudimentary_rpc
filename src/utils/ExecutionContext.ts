import Provider from './Provider';
import { Schema, Attribute } from '../contexts/contextA';
import { v4 as uuidv4 } from 'uuid';

class ExecutionContext {
    provider: Provider
    request: string
    context: { [key: string]: ContextObject }

    constructor(provider: Provider) {
        this.provider = provider;
        this.context = {};
        this.request = '';
    }

    /**
     * Handles request execution
     * @param request
     */
    handleRequest(request: string): Response {
        let parsedRequest: Request;
        try {
            parsedRequest = this.parseRequest(request) as Request;
        } catch (error) {
            return {
                _id: 'init',
                type: 'error',
                error: true,
                message: 'bad request',
            }
        }
        const { objectName = '', _id } = parsedRequest as Request;


        if (parsedRequest.init_fetch) {
            const { schema } = this.provider.getObject(objectName);

            this.context[objectName] = { ...this.provider.getObject(objectName), pointers: {} }
            return {
                _id,
                type: 'schema',
                schema,
            }

        }

        const result = this.executeRPCProcedure(parsedRequest);
        this.context[objectName].pointers[result._id] = result;
        return result;
    }


    /**
     * ParseRequest
     * @param request 
     */
    parseRequest(request: string): object {
        const jsonObject = JSON.parse(request);
        const { objectName, _id } = jsonObject;
        if (!objectName || !_id) {
            throw new Error('Invalid Request: Undefined object');
        }
        return jsonObject;
    }

    /**
     * 
     * @param request 
     */
    executeRPCProcedure(request: any): Response {
        const { type, objectName, _id } = request;
        try {
            const result: Response = requestHandlers[type](request, this.context[objectName]);
            return result;
        } catch (error) {
            return {
                _id,
                type: 'error',
                error: true,
                message: 'Error handling Request',
                // message: error.message,
            }
        }

    }
}


const requestHandlers: { [type: string]: (request: Request, obj: ContextObject) => Response } = {
    attribute: (request, contextObject) => {
        const { attribute, _id } = request as AttributeRequest;
        const { data, schema } = contextObject;
        const responseType = schema.attributes[attribute].type;
        const responseHandler = responseHandlers[responseType] || responseHandlers.default;

        const result = { result: data[attribute] };
        const response = responseHandler(result, _id);
        return response;
    },

    method: (request, contextObject) => {
        const { method, args, _id } = request as MethodRequest;
        const { data, schema } = contextObject;
        const responseReturnValue = schema.methods[method].return_value;
        const responseType = responseReturnValue.type;
        const responseHandler = responseHandlers[responseType] || responseHandlers.default;
        const methodResult = data[method](...args);
        const result = {
            result: methodResult,
            ...(responseReturnValue.schema ? { schema: responseReturnValue.schema } : null),
        }

        const response = responseHandler(result, _id);
        return response;
    },

    pointer: (request, contextObject) => {
        const { pointer, args, _id } = request as PointerRequest;
        const { pointers } = contextObject;

        const pointerValue = pointers[pointer].value;
        const { schema, result: value } = pointerValue;

        const responseType = schema.return_value.type;
        const responseHandler = responseHandlers[responseType] || responseHandlers.default;
        const result = value(...args);
        const returnSchema = schema.return_value.schema;

        return responseHandler({
            result,
            ...(returnSchema ? { schema: returnSchema } : null),
        }, _id);

    }
}


const responseHandlers: { [key: string]: (value: any, id: string) => Response } = {
    default: function defaultResponse(value, id) {
        return {
            type: 'property',
            _id: id,
            value,
        }
    },

    function: function functionResponse(value, id) {
        return {
            type: 'pointer',
            _id: id,
            value,
        }
    },

    bigint: function bigIntResponse(value, id) {
        return {
            type: 'bigint',
            _id: id,
            value: { ...value, result: value.result.toString() }
        }
    }
}

export default ExecutionContext;

interface ContextObject {
    data: Data
    schema: Schema
    pointers: Pointer
}

interface Pointer {
    [key: string]: any
}

interface Data {
    [key: string]: any
}

interface Request {
    objectName: string
    init_fetch?: true
    _id: string
}

interface AttributeRequest extends Request {
    attribute: string
}

interface MethodRequest extends Request {
    method: string
    args: any[]
}

interface PointerRequest extends Request {
    pointer: string
    args: any[]
}

interface BaseResponse {
    type: string
    _id: string
}

interface ErrorRPCResponse extends BaseResponse {
    type: 'error'
    error: true
    message: string
}

interface RPCResponse extends BaseResponse {
    value: any
}

interface SchemaResponse extends BaseResponse {
    schema: any
}

type Response = ErrorRPCResponse | RPCResponse | SchemaResponse