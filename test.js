'use strict';
var path = require('path');
var gutil = require('gulp-util');
var test = require('ava');
var data = require('gulp-data');
var nunjucks = require('./');

test.cb('precompile Nunjucks templates', function (t) {
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

test.cb('support supplying custom name in a callback', function (t) {
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

test.cb('compile Nunjucks templates', function (t) {
	var stream = nunjucks.compile({people: ['foo', 'bar']});

	stream.on('data', function (file) {
		t.is(file.contents.toString(), '<li>foo</li><li>bar</li>');
		t.end();
	});

	stream.write(new gutil.File({
		contents: new Buffer('{% for name in people %}<li>{{ name }}</li>{% endfor %}')
	}));
});

test.cb('support data via gulp-data', function (t) {
	var dl = [];

	var stream = data(function (file) {
		return {
			dd: file.path,
			dt: 'path'
		};
	});

	stream.pipe(nunjucks.compile());

	stream.on('data', function (file) {
		dl.push(file.contents.toString());
	});

	stream.on('end', function () {
		var expected = '<dt>path</dt><dd>bar.txt</dd><dt>path</dt><dd>foo.txt</dd>';
		t.is(dl.sort().join(''), expected);
		t.end();
	});

	stream.write(new gutil.File({
		path: 'foo.txt',
		contents: new Buffer('<dt>{{ dt }}</dt><dd>{{ dd }}</dd>')
	}));

	stream.write(new gutil.File({
		path: 'bar.txt',
		contents: new Buffer('<dt>{{ dt }}</dt><dd>{{ dd }}</dd>')
	}));

	stream.end();
});

test.cb('extend gulp-data and data parameter', function (t) {
	var stream = data(function () {
		return {
			people: ['foo', 'bar'],
			nested: {a: 'one', b: 'two'}
		};
	});

	stream.pipe(nunjucks.compile({
		heading: 'people',
		nested: {a: 'three'}
	}));

	stream.on('data', function (data) {
		var expected = '<h1>people</h1><li>foo</li><li>bar</li>one,two';
		t.is(data.contents.toString(), expected);
		t.end();
	});

	stream.write(new gutil.File({
		contents: new Buffer('<h1>{{ heading }}</h1>{% for name in people %}<li>{{ name }}</li>{% endfor %}{{ nested.a }},{{ nested.b }}')
	}));
});

test.cb('not alter gulp-data or data parameter', function (t) {
	var files = [];

	var stream = data(function (file) {
		return {
			contents: file.contents.toString()
		};
	});

	var parameter = {
		foo: 'foo',
		bar: 'bar',
		foobar: ['foo', 'bar']
	};

	stream.pipe(nunjucks.compile(parameter));

	stream.on('data', function (file) {
		files.push(file);
	});

	stream.on('end', function () {
		t.same(files[0].data, {contents: 'foo'});
		t.same(parameter, {
			foo: 'foo',
			bar: 'bar',
			foobar: ['foo', 'bar']
		});
		t.end();
	});

	stream.write(new gutil.File({
		contents: new Buffer('foo')
	}));

	stream.end();
});

test.cb('support custom environment', function (t) {
	var nunjucksModule = require('nunjucks');
	var env = new nunjucksModule.Environment();

	env.addFilter('shorten', function (str) {
		return str.slice(0, 5);
	});

	var stream = nunjucks.compile({message: 'Lorem ipsum'}, {env: env});

	stream.on('data', function (file) {
		t.is(file.contents.toString(), 'Lorem');
		t.end();
	});

	stream.write(new gutil.File({
		contents: new Buffer('{{ message|shorten }}')
	}));
});
