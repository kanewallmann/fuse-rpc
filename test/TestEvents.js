const assert = require('assert');
const FuseRpc = require('../src/FuseRpc.js');

describe('FuseRpc', () => {
	describe('#Events', () => {
		it('should receive event from server', async () => {
			let server = new FuseRpc.Server({port: 8080});
			let client = new FuseRpc.Client('ws://localhost:8080');

			let scope = {};

			server.register(scope);

			return new Promise((resolve, reject) => {
				client.on('open', async () => {
					let proxy = await client.getProxy();
					proxy.on('message', async (message) => {
						server.close();
						if( message !== 'Hello!' )
							reject(new Error('Unexpected data on event'));

						resolve();
					});
					server.broadcast('message', 'Hello!');
				});
			});
		});

		it('should not receive event from a different scope', async () => {
			let server = new FuseRpc.Server({port: 8080});
			let client = new FuseRpc.Client('ws://localhost:8080');

			let scope = {};

			server.register(scope);
			server.register(scope, 'namespace2');

			return new Promise((resolve, reject) => {
				client.on('open', async () => {
					let proxy = await client.getProxy('namespace2');
					proxy.on('message', async (message) => {
						server.close();
						reject(new Error('Should not have received event'));
					});
					server.emit('message', 'Hello!');
					setTimeout(() => {
						server.close();
						resolve();
					}, 100);
				});
			});
		});
	});
});