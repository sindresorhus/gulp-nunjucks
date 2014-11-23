'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var assign = require('object-assign');
var nunjucks = require('nunjucks');

module.exports = function (opts) {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-nunjucks', 'Streaming not supported'));
			return;
		}

		opts = assign({}, opts);

		var filePath = file.path;

		try {
			opts.name = typeof opts.name === 'function' && opts.name(file) || file.relative;
			file.contents = new Buffer(nunjucks.precompileString(file.contents.toString(), opts));
			file.path = gutil.replaceExtension(file.path, '.js');
			this.push(file);
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-nunjucks', err, {fileName: filePath}));
		}

		cb();
	});
};
