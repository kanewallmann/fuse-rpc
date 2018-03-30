class JsonCodec {

	binaryType () {
		// Not used
		return 'blob';
	}

	encodeMethod (id, context, method, args = []) {
		let message = {
			id,
			context,
			method,
			args
		};

		return JSON.stringify(message);
	}

	encodeCommand (id, command, args = []) {
		let message = {
			id,
			command,
			args
		};

		return JSON.stringify(message);
	}

	encodeEvent (context, event, data = null) {
		let message = {
			context,
			event,
			data
		};

		return JSON.stringify(message);
	}

	encodeResponse (id, result) {
		let message = {
			id,
			result
		};

		return JSON.stringify(message);
	}

	encodeError (code, message, id = null) {
		let _message = {
			id,
			code,
			message
		};

		return JSON.stringify(_message);
	}

	decodeMessage (message) {
		let data = JSON.parse(message);

		if (data.hasOwnProperty('code')) {
			let id = data.id;
			let message = data.message;
			let code = data.code;

			return {
				type: 'error',
				id, message, code
			};
		} else if (data.hasOwnProperty('method')) {
			let id = data.id;
			let context = data.context;
			let method = data.method;
			let args = data.args;

			return {
				type: 'method',
				id, context, method, args
			};
		} else if (data.hasOwnProperty('event')) {
			let event = data.event;
			let context = data.context;
			let eventData = data.data;

			return {
				type: 'event',
				event, data: eventData, context
			};
		} else if (data.hasOwnProperty('command')) {
			let id = data.id;
			let command = data.command;
			let args = data.args;

			return {
				type: 'command',
				id, command, args
			};
		} else if (data.hasOwnProperty('result')) {
			let id = data.id;
			let result = data.result;
			return {
				type: 'response',
				id,
				result
			};
		}
	}
}

module.exports = JsonCodec;