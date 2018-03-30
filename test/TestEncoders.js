const assert = require('assert');
const FuseRpc = require('../src/FuseRpc.js');
const msgpack = require('msgpack-lite');

describe('FuseRpc', () => {
	describe('#Codecs', () => {
		it('should use JSON encoding', async () => {
			let server = new FuseRpc.Server({port: 8080, encoder: new FuseRpc.Codecs.Json()});
			let client = new FuseRpc.Client('ws://localhost:8080', {encoder: new FuseRpc.Codecs.Json()});

			const scope = {
				rpc_getValue () {
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

		it('should use JSON packed encoding', async () => {
			let server = new FuseRpc.Server({port: 8080, encoder: new FuseRpc.Codecs.JsonPacked()});
			let client = new FuseRpc.Client('ws://localhost:8080', {encoder: new FuseRpc.Codecs.JsonPacked()});

			const scope = {
				rpc_getValue () {
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

		it('should use msgpack encoding', async () => {
			let server = new FuseRpc.Server({port: 8080, encoder: new FuseRpc.Codecs.MsgPack(msgpack)});
			let client = new FuseRpc.Client('ws://localhost:8080', {encoder: new FuseRpc.Codecs.MsgPack(msgpack)});

			const scope = {
				rpc_getValue () {
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