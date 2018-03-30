const FuseRpc = require('../../dist/fuse-rpc.node.js');
const server = new FuseRpc.Server({port: 8080});

class CounterServer {
	constructor () {
		this.counter = 0;
	}

	rpc_getCounter () {
		return this.counter;
	}

	rpc_increment () {
		this.counter++;
		this.__emit('counterChange', this.counter);
		return true;
	}
}

let counterServer = new CounterServer();
server.register(counterServer);
