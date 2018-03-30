# A JavaScript RPC server/client library that uses websockets.

[![travis](https://travis-ci.org/kanewallmann/fuse-rpc.svg?branch=master)](https://travis-ci.org/kanewallmann/fuse-rpc)

Do you want real-time method calling and events between your web app and server? This library implements an RPC protocol
over web sockets which does just that. It's incredible easy to set up and allows you to call functions on the server like
they are regular client-side functions that return Promises.

## Installation

```bash
npm install fuse-rpc
```

## Basic Usage

### Server Side

```javascript
const FuseRpc = require('fuse-rpc');
let server = new FuseRpc.Server({port: 8080});

server.register({
    rpc_toUpper(input) {
        // this.__context = this context's name
        // this.__server = instance of calling FuseRpc.Server
        // this.__emit = function to emit events to all clients connected to this context
        return input.toUpperCase();
    }
});
```

Exposed methods must start with 'rpc_' by default, this can be changed by specifying rpcMethodPrefix in Server options.
You can set it to nothing like below. But this will now include every function in the prototype chain up to Object.
```javascript
let server = FuseRpc.Server({rpcMethodPrefix: ''});
```

The options argument to Server is passed to WebSocket.Server, so you can specify any arguments that it takes too.

### Client Side

```javascript
const FuseRpc = require('fuse-rpc');
let client = new FuseRpc.Client('ws://localhost:8080');
let proxy = client.getProxy();

proxy.toUpper( 'some string' ).then( function( result ){
    console.log( result );
    // Prints 'SOME STRING'
});
```

FuseRpc.Client takes, as a second parameter, an options array which is passed to WebSocket. So you can specify any arguments
that it takes there.

## Events

The server can emit events which are picked up on the client side. Below is an example of this process.

### Server Side
```javascript
// Assuming server is an instance of FuseRpc.Server
setInterval( function(){
    server.broadcast('tick', ['some', 'data']);
}, 1000 );
```

### Client Side
```javascript
// Assuming client is a connected instance of FuseRpc.Client
client.on('tick', function( data ){
    // data contains ['some','data']
    console.log('Got tick');
});
```

## Multiple Contexts

A single server can expose multiple contexts. Events are done per context, so this is a good method to separate unrelated
parts of server-side functionality.

### Server Side
```javascript
// Assuming server is an instance of FuseRpc.Server
server.register(context1,'context1');
server.register(context2,'context2');

server.on('connection', function(ws){
    // ws.id is a unique identifier given to each connected WebSocket on the server 
    server.broadcast('newClientConnected', ws.id, 'context1');
});
```

### Client Side
```javascript
// Assuming client is a connected instance of FuseRpc.Client
let proxy1 = client.getProxy('context1');
let proxy2 = client.getProxy('context2');

proxy1.someMethodOnlyInContext1();
proxy2.someMethodOnlyInContext2();

proxy1.on('newClientConnected', function(socketId){
    // Only proxy1 gets this event
});
```

## Another Example

All arguments and return values are marshaled into JSON and sent over the network. You can call the proxy methods just like
you would be able to if it's local. Even things like dynamic arguments work.

### Server Side
```javascript
const scope = {
    rpc_concat() {
        return Array.prototype.slice.call(arguments).reduce((a, v) => a + v);
    }

    rpc_returnArray() {
        return [1,2,3,4,5];
    }
}
server.register(scope);
```

### Client Side
```javascript
console.log(await proxy.concat('Hello', ', ', ' world', '!'));      // Prints 'Hello, world!';
let array = await proxy.returnArray();                              // array = [1,2,3,4,5];
```

## RPC Protocol

By default, this library uses a JSON-encoded protocol. It also ships with a MsgPack version if you want to reduce the
number of bytes on the wire.

The first argument to FuseRpc.Codecs.MsgPack must be the msgpack-lite library.

```javascript
const msgpack = require('msgpack-lite');
new FuseRpc.Server({encoder: new FuseRpc.Codecs.MsgPack(msgpack)});
new FuseRpc.Client('ws://localhost:8080', {encoder: new FuseRpc.Codecs.MsgPack(msgpack)});
```

## License
Licensed under GPLv3

&copy; Kane Wallmann 2018. All rights reserved.
