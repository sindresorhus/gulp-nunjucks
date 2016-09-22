'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var assign = require('object-assign');
var nunjucks = require('nunjucks');

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

		var context = assign({}, data, file.data);
		var filePath = file.path;
		var env = (opts && opts.env) || new nunjucks.Environment(new nunjucks.FileSystemLoader(file.base), opts);

		try {
			file.contents = new Buffer(env.renderString(file.contents.toString(), context));
			this.push(file);
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-nunjucks', err, {fileName: filePath}));
		}

		cb();
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

		var options = assign({}, opts);
		var filePath = file.path;

		try {
			options.name = (typeof options.name === 'function' && options.name(file)) || file.relative;
			file.contents = new Buffer(nunjucks.precompileString(file.contents.toString(), options));
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
