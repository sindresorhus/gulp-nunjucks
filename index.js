'use strict';
const gutil = require('gulp-util');
const through = require('through2');
const nunjucks = require('nunjucks');

function compile(data, opts) {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-nunjucks', 'Streaming not supported'));
			return;
		}

		const context = Object.assign({}, data, file.data);
		const filePath = file.path;
		const env = (opts && opts.env) || new nunjucks.Environment(new nunjucks.FileSystemLoader(file.base), opts);

		env.renderString(file.contents.toString(), context, function (err, res) {
			if (err) return cb(new gutil.PluginError('gulp-nunjucks', err, { fileName: filePath }));
			file.contents = Buffer.from(res || '');
			this.push(file);
			cb();
		}.bind(this));
	});
}

function precompile(opts) {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-nunjucks', 'Streaming not supported'));
			return;
		}

		const options = Object.assign({}, opts);
		const filePath = file.path;

		try {
			options.name = (typeof options.name === 'function' && options.name(file)) || file.relative;
			file.contents = Buffer.from(nunjucks.precompileString(file.contents.toString(), options));
			file.path = gutil.replaceExtension(filePath, '.js');
			this.push(file);
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-nunjucks', err, {fileName: filePath}));
		}

		cb();
	});
}

module.exports = precompile;
module.exports.compile = compile;
module.exports.precompile = precompile;
