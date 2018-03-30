class MsgPackCodec {

	constructor( msgpack ){
		this.msgpack = msgpack;
	}

	binaryType () {
		return 'arraybuffer';
	}

	encodeMethod (id, context, method, args = []) {
		let message = [0, id, context, method, args];
		return this.msgpack.encode(message, {binary: true});
	}

	encodeCommand (id, command, args = []) {
		let message = [1, id, command, args];
		return this.msgpack.encode(message, {binary: true});
	}

	encodeEvent (context, event, data = null) {
		let message = [2, event, data];
		return this.msgpack.encode(message, {binary: true});
	}

	encodeResponse (id, result) {
		let message = [3, id, result];
		return this.msgpack.encode(message, {binary: true});
	}

	encodeError (code, message, id = null) {
		let _message = [4, id, code, message];
		return this.msgpack.encode(_message, {binary: true});
	}

	decodeMessage (message) {
		let data = this.msgpack.decode(new Uint8Array(message));

		if (data[0] === 0) {
			if (data.length !== 5)
				throw new ParseError();

			let id = data[1];
			let context = data[2];
			let method = data[3];
			let args = data[4];

			return {
				type: 'method',
				id, context, method, args
			};
		} else if (data[0] === 1) {
			if (data.length !== 4)
				throw new ParseError();

			let id = data[1];
			let command = data[2];
			let args = data[3];

			return {
				type: 'command',
				id, command, args
			};
		} else if (data[0] === 2) {
			if (data.length !== 4)
				throw new ParseError();

			let context = data[1];
			let event = data[2];
			let eventData = data[3];

			return {
				type: 'event',
				event, data: eventData, context
			};
		} else if (data[0] === 3) {
			if (data.length !== 3)
				throw new ParseError();

			let id = data[1];
			let result = data[2];

			return {
				type: 'response',
				id,
				result
			};

		} else if (data[0] === 4) {
			if (data.length !== 4)
				throw new ParseError();

			let id = data[1];
			let code = data[2];
			let message = data[3];

			return {
				type: 'error',
				id, message, code
			};
		}
	}
}

module.exports = MsgPackCodec;