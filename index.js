'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var assign = require('object-assign');
var nunjucks = require('nunjucks');

module.exports = function (options) {
	options = options || {};

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-nunjucks', 'Streaming not supported'));
			return cb();
		}

		var opts = assign({}, options);

		try {
			opts.name = typeof options.name === 'function' && options.name(file) || file.relative;
			file.contents = new Buffer(nunjucks.precompileString(file.contents.toString(), opts));
			file.path = gutil.replaceExtension(file.path, '.js');
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-nunjucks', err));
		}

		this.push(file);
		cb();
	});
};
