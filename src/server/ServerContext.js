class ServerContext {
	constructor (scope, methodPrefix) {
		this.scope = scope;
		this.methodPrefix = methodPrefix;
		this.methods = this.extractMethods(scope);
	}

	extractMethods (obj) {
		let p = [];
		for (; obj !== null; obj = Object.getPrototypeOf(obj)) {
			let op = Object.getOwnPropertyNames(obj);
			for (let i = 0; i < op.length; i++) {
				if (p.indexOf(op[i]) === -1) {
					if (op[i].substr(0, this.methodPrefix.length) === this.methodPrefix
						&& typeof obj[op[i]] === 'function') {
						let methodName = op[i].substr(this.methodPrefix.length);
						if (methodName === '__getMethods')
							throw new Error('Reserved method name `__getMethods` used.');
						p.push(op[i].substr(this.methodPrefix.length));
					}
				}
			}
		}
		return p;
	}

	async callMethod (method, args) {
		return await this.scope[this.methodPrefix + method].apply(this.scope, args);
	}
}

module.exports = ServerContext;