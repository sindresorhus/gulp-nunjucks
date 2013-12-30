'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var nunjucks = require('./index');

it('should precompile Nunjucks templates', function (cb) {
	var stream = nunjucks();

	stream.on('data', function (file) {
		assert.equal(file.path, __dirname + '/fixture.js');
		assert.equal(file.relative, 'fixture.js');
		assert(/nunjucksPrecompiled/.test(file.contents.toString()));
		cb();
	});

	stream.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/fixture.html',
		contents: new Buffer('<h1>{{ test }}</h1>')
	}));
});
