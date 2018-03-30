const Server = require('./server/Server.js');
const Client = require('./client/Client.js');

const JsonCodec = require('./codec/JsonCodec.js');
const JsonPackedCodec = require('./codec/JsonPackedCodec.js');
const MsgPackCodec = require('./codec/MsgPackCodec.js');

const Codecs = {
	Json: JsonCodec,
	JsonPacked: JsonPackedCodec,
	MsgPack: MsgPackCodec
};

module.exports = {Server, Client, Codecs};
