'use strict';
var es = require('event-stream');
var gutil = require('gulp-util');
var nunjucks = require('nunjucks');

module.exports = function (options) {
	return es.map(function (file, cb) {
		options = options || {};
		options.name = options.name || file.path;
		file.contents = new Buffer(nunjucks.precompileString(file.contents.toString(), options));
		file.path = gutil.replaceExtension(file.path, '.js');
		cb(null, file);
	});
};
