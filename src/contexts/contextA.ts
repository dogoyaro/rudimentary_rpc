import Provider from '../utils/Provider';

const taskObject: ContextObject= {
    name: 'file expense reports',
    operation: function addOperation(a, b) {
        return a + b;
    },
    age: 3,
    projects: {
        manhattanProject: {
            description: 'deliver a slew of cookies to manhattan?'
        }
    },
    operationFactory: function generateOperation() {
        return function generatedOperation() {
            return 'stuff';
        }
    },
    bigNumber: BigInt(2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222),
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
                type: 'function',
                schema: {
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
        },
        age: {
            type: 'number'
        },
        projects: {
            type: 'object'
        },
        bigNumber: {
            type: 'bigint'
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
        return_value: { type: string, schema?: object }
    }
}

export interface Attribute {
    [key: string]: {
        type: string
        schema?: object
    }
}

export function getObjectProvider() {
    const objectProvider = new Provider();
    objectProvider.register('taskObject', { data: taskObject, schema: taskObjectSchema });

    return objectProvider;
}

interface ContextObject { 
    name: string
    bigNumber: BigInt
    operation: (a: number, b: number) => number
    operationFactory: () => any
    age: number
    projects: object
} 