const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require(`path`);

const srcPath = path.resolve(__dirname, `./resources`);
const distPath = path.resolve(__dirname, `./assets/`);

module.exports = async function(mode = `production`) {
	const jsFiles = {
		'scss/common.scss': `${srcPath}/scss/common.scss`,
		'js/common': `${srcPath}/js/common.js`,
		'js/main.map': `${srcPath}/js/main.map.js`,
		'js/route.map': `${srcPath}/js/route.map.js`
	};

	return {
		mode: mode,
		resolve: {
			extensions: ['*', '.js', '.jsx']
		},
		module: {
			rules: [
				{
					test: /\.(js|jsx)$/,
					exclude: /node_modules/,
					use: [ 'babel-loader' ]
				},
				{
					test:/\.(s*)css$/,
					loaders : ExtractTextPlugin.extract({
						fallback : 'style-loader',
						use : ['css-loader', 'sass-loader?outputStyle=compact']
					}),
				}
			]
		},
		plugins: [
			new ExtractTextPlugin('./bundle.css')
		],
		entry: jsFiles,
		output: {
			path: distPath,
			filename: `[name].min.js`
		}
	};
};