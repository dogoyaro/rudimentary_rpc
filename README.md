Introduction:
Implements two contexts:
 - A node js context
 - A browser context

 These contexts are both trusted and the channel over which they communicate are trusted as well.

This solution:
1. Implements a mechanism for the two contexts to access the same object in an asynchronous way.
2. Uses the above implementation in two contexts of choice. The exact communication method between
them (e.g. websockets, ​window.postMessage()​ etc) is entirely up to you.

Context 1: A NodeJs process hosting a websocket server
Context 2: A NodeJs process hosting a websocket client









