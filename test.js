'use strict';
var path = require('path');
var gutil = require('gulp-util');
var test = require('ava');
var nunjucks = require('./');

test('precompile Nunjucks templates', function (t) {
	var stream = nunjucks();

	stream.on('data', function (file) {
		t.is(file.path, path.join(__dirname, 'fixture', 'fixture.js'));
		t.is(file.relative, 'fixture/fixture.js');
		t.regexTest(/nunjucksPrecompiled/, file.contents.toString());
		t.regexTest(/"fixture\/fixture\.html"/, file.contents.toString());
		t.end();
	});

	stream.write(new gutil.File({
		base: __dirname,
		path: path.join(__dirname, 'fixture', 'fixture.html'),
		contents: new Buffer('<h1>{{ test }}</h1>')
	}));
});

test('support supplying custom name in a callback', function (t) {
	var stream = nunjucks({
		name: function () {
			return 'custom';
		}
	});

	stream.on('data', function (file) {
		t.regexTest(/{}\)\["custom"\]/, file.contents.toString());
		t.end();
	});

	stream.write(new gutil.File({
		base: __dirname,
		path: path.join(__dirname, 'fixture', 'fixture.html'),
		contents: new Buffer('<h1>{{ test }}</h1>')
	}));
});
