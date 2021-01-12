Introduction:
Implements two contexts:
 - A node js context - server/client

 These contexts are both assumed trusted and the channel over which they communicate are trusted as well.

This solution:
1. Implements a mechanism for the two contexts to access the same object in an asynchronous way.
2. Uses the above implementation in two contexts of choice

ContextA: A NodeJs process hosting a websocket server
ContextB: A NodeJs process hosting a websocket client

Instructions:
- run `yarn install`
- start the server which serves as the host for the first context: contextA  `npx ts-node src/server.ts`
- modify the contextB to access properties on the object hosted in contextA.
- run contextB hosted on the client and observe remote access to contextA `npx ts-node src/client.ts`.



Methodology:

The contexts share a `protocol` that allows predictable communication between contexts. Each object has a schema that highlights the various *attributes* and *methods* that an object has, also stating return types and argument types(in the case of methods)

Accessing a property on the object is done through a Remote Procedure Call, with higher order functions returning pointers to their return values. Special return values are handled using an extensible list of response handlers for each custom return type.



