import Provider from './utils/Provider';

const taskObject: { name: string, operation: (a: number, b: number) => number } = {
    name: 'file expense reports',
    operation: function addOperation(a, b) {
        return a + b;
    }
};

export function getObjectProvider() {
    const objectProvider = new Provider();
    objectProvider.register('taskObject', taskObject);

    return objectProvider;
}
