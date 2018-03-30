const assert = require('assert');
const FuseRpc = require('../src/FuseRpc.js');

describe('FuseRpc', () => {
	describe('#Options', () => {
		it('should listen on specified port', async () => {
			let server = new FuseRpc.Server({port: 8012});
			let client = new FuseRpc.Client('ws://localhost:8012');

			return new Promise((resolve, reject) => {
				client.on('close', () => {
					server.close();
					resolve();
				});

				client.on('open', () => {
					client.close();
				});
			});
		});

		it('should use specified method prefix', async () => {
			let server = new FuseRpc.Server({port: 8090, rpcMethodPrefix: '_test_'});
			let client = new FuseRpc.Client('ws://localhost:8090');

			const scope = {
				_test_getValue () {
					return 100;
				}
			};

			server.register(scope);

			return new Promise((resolve, reject) => {
				client.on('open', async () => {
					let proxy = await client.getProxy();
					let result = await proxy.getValue();
					assert.equal(result, 100, 'getValue did not return expected value');
					server.close();
					resolve();
				});
			});
		});
	});
});