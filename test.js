'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var nunjucks = require('./');

it('should precompile Nunjucks templates', function (cb) {
	var stream = nunjucks();

	stream.on('data', function (file) {
		assert.equal(file.path, __dirname + '/fixture/fixture.js');
		assert.equal(file.relative, 'fixture/fixture.js');
		assert(/nunjucksPrecompiled/.test(file.contents.toString()));
		assert(/"fixture\/fixture\.html"/.test(file.contents.toString()));
		cb();
	});

	stream.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/fixture/fixture.html',
		contents: new Buffer('<h1>{{ test }}</h1>')
	}));
});

it('should support supplying custom name in a callback', function (cb) {
	var stream = nunjucks({
		name: function (file) {
			return 'custom';
		}
	});

	stream.on('data', function (file) {
		assert(/{}\)\["custom"\]/.test(file.contents.toString()));
		cb();
	});

	stream.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/fixture/fixture.html',
		contents: new Buffer('<h1>{{ test }}</h1>')
	}));
});
