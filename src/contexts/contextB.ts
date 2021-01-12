import Consumer from '../utils/Consumer';

export default async function contextB(consumer: Consumer) {
    const result: any = await consumer.getRemoteObject('taskObject');
    const operation = await result.operationFactory();
    console.log('the operation value', await operation());

    console.log('the operation value: ', await result.operation(2, 3));
    console.log('the age value', await result.age);
    console.log('the projects', await result.projects);
    console.log('the operation value: ', await result.operation2);
    console.log('the big number', await result.bigNumber);

    console.log('the name value: ', await result.name);
}