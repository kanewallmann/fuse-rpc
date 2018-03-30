class ClientProxy {
	constructor (client, methods, context) {
		this.client = client;
		this.methods = methods;
		this.context = context;
		this.listeners = [];

		let self = this;

		for (let i = 0; i < methods.length; i++) {
			this[methods[i]] = async function () {
				let args = [];
				for (let j = 0; j < arguments.length; j++) {
					args.push(arguments[j]);
				}
				return client.call(methods[i], args, self.context);
			};
		}
	}

	on (event, callback) {
		if (!this.listeners.hasOwnProperty(event))
			this.listeners[event] = [];
		this.listeners[event].push(callback);
	}

	off (event = null, callback = null) {
		if (event == null) {
			this.listeners = {};
		} else if (callback === null) {
			this.listeners[event] = [];
		} else {
			for (let i = 0; i < this.listeners[event].length; i++) {
				if (this.listeners[event][i] === callback) {
					delete  this.listeners[event][i];
				}
			}
		}
	}

	emit (event, data) {
		if (!this.listeners.hasOwnProperty(event))
			return;
		for (let i = 0; i < this.listeners[event].length; i++) {
			this.listeners[event][i].call(null, data);
		}
	}
}

module.exports = ClientProxy;