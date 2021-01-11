import Provider from './utils/Provider';

const taskObject: { name: string, operation: (a: number, b: number) => number, operationFactory: () => any } = {
    name: 'file expense reports',
    operation: function addOperation(a, b) {
        return a + b;
    },
    operationFactory: function generateOperation() {
        return function generatedOperation() {
            return 'stuff';
        }
    }
};

const taskObjectSchema: Schema = {
    service: 'taskObject',
    methods: {
        operation: {
            params: {
                a: {
                    type: 'number',
                },
                b: {
                    type: 'number',
                }
            },
            return_value: {
                type: 'number'
            }
        },
        operationFactory: {
            params: {},
            return_value: {
                type: {
                    params: {},
                    return_value: {
                        type: 'string'
                    }
                }
            }
        }
    },
    attributes: {
        name: {
            type: 'string',
        }
    }
};

export interface Schema {
    service: string
    methods: Methods
    attributes: Attribute
}

export interface Methods {
    [key: string]: {
        params: {
            [key: string]: {
                type: string
            }
        }
        return_value: { type: string } | Methods
    }
}

export interface Attribute {
    [key: string]: {
        type: string
    }
}

export function getObjectProvider() {
    const objectProvider = new Provider();
    objectProvider.register('taskObject', { data: taskObject, schema: taskObjectSchema });

    return objectProvider;
}
