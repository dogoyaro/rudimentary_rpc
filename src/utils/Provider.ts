import { Schema } from '../contextA';


class Provider {
    _registeredObjects: any;

    constructor() {
        this._registeredObjects = {};
    }

    /**
     * Register a new object to the object provider
     * @param objectName 
     * @param properties 
     */
    register(objectName: string, properties: { data: object, schema: Schema}) {
        this._registeredObjects[objectName] = properties;
    }

    /**s
     * Fetch an object with the given objectName
     * @param objectName 
     */
    getObject(objectName: string): any {
        return this._registeredObjects[objectName];
    }
}

// getting the object might convert the object to a schema.
// the schema will have the type interface as part of the metadata sent

export default Provider;