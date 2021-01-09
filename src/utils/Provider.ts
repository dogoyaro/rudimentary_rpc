class Provider {
    _registeredObjects: any;
    _schema: object;

    constructor() {
        this._registeredObjects = {};
        this._schema = {};
    }

    /**
     * Register a new object to the object provider
     * @param objectName 
     * @param properties 
     */
    register(objectName: string, properties: object) {
        this._registeredObjects[objectName] = properties;
    }

    /**s
     * Fetch an object with the given objectName
     * @param objectName 
     */
    getObject(objectName: string): any {
        return this._registeredObjects[objectName];
    }

    /**
     * 
     * @param request 
     */
    sanitizeRequest(request: string): boolean {
        return true;
    }

    get schema() {
        return this._schema;
    }
}

// getting the object might convert the object to a schema.
// the schema will have the type interface as part of the metadata sent

export default Provider;