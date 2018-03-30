const FuseRpc = require('../../dist/fuse-rpc.node.js');
const client = new FuseRpc.Client('ws://localhost:8080');

client.on('open', async () => {

	let proxy = await client.getProxy('chat');

	let remainder = '';

	proxy.on('message', (payload) => {
		console.log(payload.user + ': ' + payload.message);
	});

	proxy.on('serverMessage', (message) => {
		console.log('[' + message + ']');
	});

	let id = await proxy.connect();

	function processLine (line) {
		if (line.substr(0,1) === '!') {
			let command = line.substr(1).split(' ')[0];

			switch (command) {
				case 'setName':
					proxy.setName(id, line.substr('!setName '.length, line.length));
					break;
			}
		} else {
			proxy.send(id, line);
		}
	}

	process.stdin.on('data', (chunk) => {
		let lines = chunk.toString().split('\r\n');
		lines[0] = remainder + lines[0];
		remainder = lines.pop();
		lines.forEach(processLine);
	});

});


