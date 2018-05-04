'use strict';
const through = require('through2');
const nunjucks = require('nunjucks');
const PluginError = require('plugin-error');

function compile(data, options = {}) {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new PluginError('gulp-nunjucks', 'Streaming not supported'));
			return;
		}

		const context = Object.assign({}, data, file.data);
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
		} catch (err) {
			this.emit('error', new PluginError('gulp-nunjucks', err, {fileName: filePath}));
		}

		cb();
	});
}

function precompile(options) {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new PluginError('gulp-nunjucks', 'Streaming not supported'));
			return;
		}

		const localOptions = Object.assign({}, options);
		const filePath = file.path;

		try {
			localOptions.name = (typeof localOptions.name === 'function' && localOptions.name(file)) || file.relative;
			file.contents = Buffer.from(nunjucks.precompileString(file.contents.toString(), localOptions));
			file.extname = '.js';
			this.push(file);
		} catch (err) {
			this.emit('error', new PluginError('gulp-nunjucks', err, {fileName: filePath}));
		}

		cb();
	});
}

module.exports = precompile;
module.exports.compile = compile;
module.exports.precompile = precompile;
