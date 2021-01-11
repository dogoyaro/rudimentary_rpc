import Provider from './Provider';
import { Schema, Attribute } from '../contextA';
import { v4 as uuidv4 } from 'uuid';

class ExecutionContext {
    provider: Provider
    request: string
    context: { [key: string]: ContextObject }

    constructor(provider: Provider) {
        this.provider = provider;
        this.context = { };
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
                _id: uuidv4(),

                type: 'error',
                error: true,
                message: 'bad request',
            }
        }
        const { objectName = '' } = parsedRequest as Request;


        if (parsedRequest.init_fetch) {
            const { schema } = this.provider.getObject(objectName);

            this.context[objectName] = { ...this.provider.getObject(objectName), pointers: {} }
            return {
                _id: uuidv4(),
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
                _id: uuidv4(),
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
        const { attribute } = request as AttributeRequest;
        const { data, schema } = contextObject;
        const responseType = schema.attributes[attribute].type;
        const responseHandler = responseHandlers[responseType] || responseHandlers.default;

        const result = { result: data[attribute] };
        const response = responseHandler(result);
        return response;
    },

    method: (request, contextObject) => {
        const { method, args } = request as MethodRequest;
        const { data, schema } = contextObject;
        const responseReturnValue = schema.methods[method].return_value;
        const responseType = responseReturnValue.type;
        const responseHandler = responseHandlers[responseType] || responseHandlers.default;
        const methodResult = data[method](...args);
        const result = {
            result: methodResult,
            ...(responseReturnValue.schema ? { schema: responseReturnValue.schema } : null),
        }

        const response = responseHandler(result);
        return response;
    },

    pointer: (request, contextObject) => {
        console.log('constextObject', contextObject, request);

        const { pointer, args } = request as PointerRequest;
        const { pointers } = contextObject;

        const pointerValue = pointers[pointer].value;
        const { schema, result: value } = pointerValue;

        const responseType = schema.return_value.type;
        const responseHandler = responseHandlers[responseType] || responseHandlers.default;
        const result = value(...args);
        const returnSchema = schema.return_value.schema;

        return responseHandler({
            result,
            ...(returnSchema ? { schema: returnSchema } : null ),
        })

    }
}


const responseHandlers: { [key: string]: (value: any) => Response } = {
    default: function defaultResponse(value) {
        return {
            type: 'property',
            value,
            _id: uuidv4()
        }
    },

    function: function functionResponse(value) {
        return {
            type: 'pointer',
            value,
            _id: uuidv4()
        }
    }
}


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

export default ExecutionContext;