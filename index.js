'use strict';
const through = require('through2');
const nunjucks = require('nunjucks');
const PluginError = require('plugin-error');
const is = require('@sindresorhus/is');

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

		let isAsync = false;

		if (options.filters && !options.env) {
			for (const key of Object.keys(options.filters)) {
				const filter = options.filters[key];
				if (is.asyncFunction(filter)) {
					isAsync = true;
					env.addFilter(key, async (...args) => {
						const cb = args.pop();
						try {
							const result = await filter(...args);
							cb(null, result);
						} catch (error) {
							cb(error, null);
						}
					}, true);
				} else {
					env.addFilter(key, filter);
				}
			}
		}

		try {
			const writeResult = result => {
				file.contents = Buffer.from(result);
				file.extname = '.html';
				this.push(file);
			};

			if (isAsync) {
				env.renderString(file.contents.toString(), context, (error, result) => {
					if (error) {
						this.emit('error', new PluginError('gulp-nunjucks', error, {fileName: filePath}));
						callback();
						return;
					}

					writeResult(result);
					callback();
				});
			} else {
				writeResult(env.renderString(file.contents.toString(), context));
				callback();
			}
		} catch (error) {
			this.emit('error', new PluginError('gulp-nunjucks', error, {fileName: filePath}));
			callback();
		}
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
