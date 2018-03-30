const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

module.exports = [
	{
		entry: './src/FuseRpc.js',
		target: 'node',
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: 'fuse-rpc.node.js',
			library: 'FuseRpc',
			libraryTarget: 'umd'
		},
		resolve: {
			extensions: ['.js']
		},
		plugins: [
			new UglifyJsPlugin()
		],
		module: {
			loaders: [
				{
					test: /\.js$/,
					loader: 'babel-loader',
					query: {
						presets: ['es2015']
					}
				}
			]
		}
	},
	{
		entry: './src/FuseRpc.js',
		target: 'web',
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: 'fuse-rpc.web.js',
			library: 'FuseRpc',
			libraryTarget: 'var'
		},
		resolve: {
			extensions: ['.js']
		},
		plugins: [
			new UglifyJsPlugin()
		],
		module: {
			loaders: [
				{
					test: /\.js$/,
					loader: 'babel-loader',
					query: {
						presets: ['es2015']
					}
				}
			]
		}
	}];
