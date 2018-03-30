const WebSocket = require('isomorphic-ws');
const EventEmitter = require('events');

const JsonPackedCodec = require('./../codec/JsonPackedCodec.js');
const ServerContext = require('./ServerContext.js');

class Server extends EventEmitter {
	constructor (options) {
		super();

		let self = this;

		this.options = Object.assign({
			port: 8080,
			rpcMethodPrefix: 'rpc_'
		}, options);

		// Setup codec
		if (this.options.hasOwnProperty('codec'))
			this.codec = this.options.codec;
		else
			this.codec = new JsonPackedCodec();

		this.clientId = 0;

		// Mapping of contexts to `ServerContext`s
		this.contexts = {};

		// Mapping of contexts to `WebSocket`s
		this.listeners = {};

		// Listening server
		this.wss = new WebSocket.Server(this.options);
		this.wss.binaryType = this.codec.binaryType();

		// Handle incoming connections
		this.wss.on('connection', (ws) => {
			ws.id = this.clientId++;
			ws.binaryType = this.codec.binaryType();

			self.emit('connection', ws);

			ws.onmessage = self.onMessage.bind(self, ws);
			ws.onclose = self.onClose.bind(self, ws);
			ws.onerror = self.onError.bind(self, ws);
		});
	}

	onOpen () {
		this.emit('open');
	}

	/**
	 * Called on 'error' event by `WebSocket`
	 *
	 * @param ws The WebSocket which errored
	 */
	onError (ws) {
		this.emit('error', ws);
	}

	/**
	 * Called on 'close' event by `WebSocket`
	 *
	 * @param ws The WebSocket which is closing
	 */
	onClose (ws) {
		this.emit('close', ws);
		for (let listeners in this.listeners) {
			for (let i = 0; i < listeners.length; i++) {
				if (listeners[i] === ws) {
					delete listeners[i];
					break;
				}
			}
		}
	}

	/**
	 * Registers a given `scope` under the scope `scope`
	 *
	 * @param scope
	 * @param context
	 */
	register (scope, context = '_') {
		let self = this;

		// Ensure uniqueness
		if (this.contexts.hasOwnProperty(context))
			throw new Error('Context with that scope has already been registered');

		this.contexts[context] = new ServerContext(scope, this.options.rpcMethodPrefix);

		// Inject properties and methods into scope
		scope.__context = context;
		scope.__server = this;

		scope.__emit = function (event, data) {
			self.broadcast(event, data, context);
		};
	}

	/**
	 * Called when message received by `WebSocket`
	 *
	 * @param ws
	 * @param message
	 * @returns {Promise<void>}
	 */
	async onMessage (ws, data) {
		try {
			let tx = this.codec.decodeMessage(data.data);

			//console.log(tx);

			if (tx.type === 'command') {
				let id = tx.id;
				let command = tx.command;
				let args = tx.args;

				// Insert client `WebSocket` as first argument to protocol method
				args.unshift(ws);

				let result = this['command_' + command].apply(this, args);
				this._respond(ws, id, result);
			} else if (tx.type === 'method') {
				let context = tx.context;
				let id = tx.id;
				let method = tx.method;
				let args = tx.args;

				// Ensure a registered scope exists for this scope
				if (!this.contexts.hasOwnProperty(context)) {
					this._unknownContext(ws, id);
				} else {
					let result = this.contexts[context].callMethod(method, args);
					this._respond(ws, id, result);
				}
			}
		} catch (error) {
			console.log(error);
			this._parseError(ws);
		}
	}

	/**
	 * Called by clients to return list of methods.
	 *
	 * @param ws
	 * @param context
	 * @returns {*}
	 */
	command_list (ws, context) {
		if (!this.contexts.hasOwnProperty(context))
			return [];

		return this.contexts[context].methods;
	}

	/**
	 * Called by clients to request receiving of events within `scope`
	 *
	 * @param ws
	 * @param context
	 */
	command_listen (ws, context) {
		this.registerListener(context, ws);
		return true;
	}

	/**
	 * Called by clients to stop receiving events within `scope`
	 *
	 * @param ws
	 * @param context
	 */
	command_mute (ws, context) {
		this.removeListener(context, ws);
	}

	/**
	 * Registers the given `WebSocket` ws as a listener for events within `scope`.
	 *
	 * @param context
	 * @param ws
	 */
	registerListener (context, ws) {
		if (!this.listeners.hasOwnProperty(context))
			this.listeners[context] = [];

		// Check if already listening
		if (this.listeners[context].includes(ws))
			return;

		this.listeners[context].push(ws);
	}

	/**
	 * Removes the given `WebSocket` ws from list of sockets to receive events within `scope`.
	 *
	 * @param context
	 * @param ws
	 */
	removeListener (context, ws) {
		for (let i = 0; i <= this.listeners[context].length; i++) {
			if (this.listeners[context][i] === ws) {
				delete this.listeners[i];
				return;
			}
		}
	}

	/**
	 * Emits `event` with `data` to all `WebSocket`s currently listening.
	 *
	 * @param event
	 * @param data
	 * @param context
	 */
	broadcast (event, data, context = '_') {
		if (!this.listeners.hasOwnProperty(context))
			return;
		let self = this;
		this.listeners[context].forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(this.codec.encodeEvent(context, event, data));
			} else if (client.readyState === WebSocket.CLOSED) {
				// Prune closed client listeners
				self.removeListener(context, client);
			}
		});
	}

	close () {
		this.wss.close(1000, 'Server terminating');
	}

	_respond (ws, id, result) {
		if (ws.readyState === WebSocket.OPEN)
			ws.send(this.codec.encodeResponse(id, result));
	}

	_invalidRequest (ws) {
		ws.send(this.codec.encodeError(-1, 'Invalid request'));
	}

	_parseError (ws) {
		ws.send(this.codec.encodeError(-2, 'Error parsing message'));
	}

	_unknownContext (ws, id) {
		ws.send(this.codec.encodeError(-3, 'Unknown context', id));
	}
}

module.exports = Server;
