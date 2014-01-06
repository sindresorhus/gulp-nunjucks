'use strict';
var gutil = require('gulp-util');
var through = require('through');
var nunjucks = require('nunjucks');

module.exports = function (options) {
	options = options || {};

	return through(function (file) {
		options.name = typeof options.name === 'function' && options.name(file) || file.relative;
		file.contents = new Buffer(nunjucks.precompileString(file.contents.toString(), options));
		file.path = gutil.replaceExtension(file.path, '.js');
		this.emit('data', file);
	});
};
