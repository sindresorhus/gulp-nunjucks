'use strict';
const through = require('through2');
const nunjucks = require('nunjucks');
const PluginError = require('plugin-error');

function compile(data, options = {}) {
	return through.obj(function (file, encoding, callback) {
		if (file.isNull()) {
			callback(null, file);
			return;
		}

		if (file.isStream()) {
			callback(new PluginError('gulp-nunjucks', 'Streaming not supported'));
			return;
		}

		const context = {...data, ...file.data};
		const filePath = file.path;
		const env = options.env || new nunjucks.Environment(new nunjucks.FileSystemLoader(file.base), options);

		if (options.filters && !options.env) {
			for (const key of Object.keys(options.filters)) {
				env.addFilter(key, options.filters[key]);
			}
		}

		try {
			file.contents = Buffer.from(env.renderString(file.contents.toString(), context));
			this.push(file);
		} catch (error) {
			this.emit('error', new PluginError('gulp-nunjucks', error, {fileName: filePath}));
		}

		callback();
	});
}

function precompile(options) {
	return through.obj(function (file, encoding, callback) {
		if (file.isNull()) {
			callback(null, file);
			return;
		}

		if (file.isStream()) {
			callback(new PluginError('gulp-nunjucks', 'Streaming not supported'));
			return;
		}

		const localOptions = {...options};
		const filePath = file.path;

		try {
			localOptions.name = (typeof localOptions.name === 'function' && localOptions.name(file)) || file.relative;
			file.contents = Buffer.from(nunjucks.precompileString(file.contents.toString(), localOptions));
			file.extname = '.js';
			this.push(file);
		} catch (error) {
			this.emit('error', new PluginError('gulp-nunjucks', error, {fileName: filePath}));
		}

		callback();
	});
}

module.exports = precompile;
module.exports.compile = compile;
module.exports.precompile = precompile;
