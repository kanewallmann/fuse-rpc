const WebSocket = require('isomorphic-ws');
const EventEmitter = require('events');

const JsonPackedCodec = require('./../codec/JsonPackedCodec.js');
const ClientProxy = require('./ClientProxy.js');

class Client extends EventEmitter {
	constructor (host, options = {}) {
		super();

		this.options = options;

		if (this.options.hasOwnProperty('codec'))
			this.encoder = this.options.codec;
		else
			this.encoder = new JsonPackedCodec();

		this.contexts = [];

		this.ws = new WebSocket(host);
		this.ws.binaryType = this.encoder.binaryType();
		this.callbacks = {};
		this.id = 0;
		this.clientId = 0;

		this.ws.onopen = this.onOpen.bind(this);
		this.ws.onmessage = this.onMessage.bind(this);
		this.ws.onclose = this.onClose.bind(this);
	}

	onOpen (ws) {
		this.emit('open');
	}

	onClose () {
		for (let callback in this.callbacks) {
			this.callbacks[callback].reject();
		}
		this.callbacks = {};
		this.contexts = {};
		this.emit('close');
	}

	onMessage (data) {
		let self = this;
		try {
			let tx = this.encoder.decodeMessage(data.data);

			//console.log(tx);

			if (tx.type === 'event') {
				let context = tx.context;
				let event = tx.event;
				let data = tx.data;
				let proxy = this.contexts[context];
				proxy.emit(event, data);
			} else if (tx.type === 'response' || tx.type === 'error') {
				// It's a response to one of our calls
				let id = tx.id;
				let result = tx.result;

				// Make sure we actually sent this request ID
				if (self.callbacks.hasOwnProperty(id)) {
					let callback = self.callbacks[id];

					if (tx.type === 'error') {
						callback.reject(tx.message);
					} else {
						callback.resolve(result);
					}

					// Clean up callback list
					delete self.callbacks[id];
				}
			}
		} catch (error) {
			console.log(error);
			this.ws.close(1000, 'Malformed message received');
			this.emit('close');
		}
	}

	close () {
		this.ws.close(1000, 'Client terminating');
	}

	/**
	 * Constructs a proxy object that can be used to call methods on server.
	 *
	 * @param context
	 * @returns {Promise<*>}
	 */
	async getProxy (context = '_') {
		if (this.contexts.hasOwnProperty(context))
			return this.contexts[context];

		let methods = await this.getMethods(context);
		let proxy = new ClientProxy(this, methods, context);
		this.contexts[context] = proxy;
		await this.registerListener(context);

		return proxy;
	}

	/**
	 * Stops the proxy from receiving and disseminating events from server and cleans it up.
	 * The proxy object cannot be used after calling this method.
	 *
	 * @param proxy
	 * @returns {Promise<void>}
	 */
	async disposeProxy (proxy) {
		proxy.off();
		await this.unregisterListener(proxy.context);
		delete this.contexts[proxy.context];
	}

	/**
	 * Requests method list from server for `scope`.
	 *
	 * @param context
	 * @returns {Promise<*>}
	 */
	async getMethods (context = '_') {
		return await this.command('list', [context]);
	}

	/**
	 * Requests server to send events in `scope` to this client.
	 *
	 * @param context
	 * @returns {Promise<*>}
	 */
	async registerListener (context = '_') {
		return await this.command('listen', [context]);
	}

	/**
	 * Requests server to stop sending events in `scope` to this client.
	 *
	 * @param context
	 * @returns {Promise<*>}
	 */
	async unregisterListener (context = '_') {
		return await this.command('mute', [context]);
	}

	/**
	 * Issues a `command` request to the server. This is used for protocol level logic.
	 *
	 * @param command
	 * @param args
	 * @returns {Promise<*>}
	 */
	async command (command, args = []) {
		if (this.ws.readyState !== WebSocket.OPEN)
			throw new Error('Client is not connected to server');

		return new Promise((resolve, reject) => {
			let id = this.id++;
			let data = this.encoder.encodeCommand(id, command, args);
			this.callbacks[id] = {resolve, reject};
			this.ws.send(data);
		});
	}

	/**
	 * Calls `method` on the server.
	 *
	 * @param method
	 * @param args
	 * @param context
	 * @returns {Promise<*>}
	 */
	async call (method, args = [], context = '_') {
		if (this.ws.readyState !== WebSocket.OPEN)
			throw new Error('Client is not connected to server');

		return new Promise((resolve, reject) => {
			let id = this.id++;
			let data = this.encoder.encodeMethod(id, context, method, args);
			this.callbacks[id] = {resolve, reject};
			this.ws.send(data);
		});
	}
}

module.exports = Client;
