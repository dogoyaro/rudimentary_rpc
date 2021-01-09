import Provider from './Provider';

class ExecutionContext {
    provider: Provider
    request: string
    objectName: string
    context: object

    constructor(provider: Provider) {
        this.provider = provider;
        this.objectName = '';
        this.context = {};
        this.request = '';
    }

    /**
     * 
     * @param request 
     */
    handleRequest(request: string): Response {
        if (!this.provider.sanitizeRequest(request)) {
            return {
                error: true,
                message: 'bad request',
            }
        }
        const parsedRequest = this.parseRequest(request);

        if (!this.objectName) {
            const { objectName = '' } = parsedRequest as Request;
            this.objectName = objectName;
            this.context[objectName] = { ...this.provider.getObject(objectName) }
            return {
                schema: this.provider.schema,
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
    parseRequest(request: string): {} {
        return JSON.parse(request);
    }

    /**
     * 
     * @param request 
     */
    executeRPCProcedure(request: any): Response {
        const {
            procedure: {
                method = '',
                attribute = '',
                args = [],
            } = {} } = request;
        const service = this.context[this.objectName];
        let result: any;
        if (method) {
            result = service[method](...args);
            this.context[this.objectName] = {
                ...this.context[this.objectName],
                [method]: result,
            }
        }

        return service[attribute];
    }
}

interface Request {
    objectName?: string
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