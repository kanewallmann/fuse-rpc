const FuseRpc = require('../../dist/fuse-rpc.node.js');
const server = new FuseRpc.Server();

class ChatServer {
	constructor () {
		this.id = 0;
		this.names = {};
	}

	getName (id) {
		if (this.names.hasOwnProperty(id))
			return this.names[id];

		return 'User_' + id;
	}

	serverMessage (message) {
		this.__emit('serverMessage', message);
	}

	disconnect (ws) {
		let id = ws.id;
		this.serverMessage(this.getName(id) + ' has left the server');
	}

	rpc_connect () {
		let id = this.id++;
		this.serverMessage(this.getName(id) + ' has joined the server');
		return id;
	}

	rpc_setName (id, newName) {
		let oldName = this.getName(id);
		this.names[id] = newName;
		this.serverMessage(oldName + ' has changed their name to ' + newName);
	}

	rpc_send (id, message) {
		this.__emit('message', {user: this.getName(id), message});
	}
}

let chatServer = new ChatServer();
server.register(chatServer, 'chat');
server.on('close', chatServer.disconnect.bind(chatServer));