import path from 'path';
import test from 'ava';
import gutil from 'gulp-util';
import data from 'gulp-data';
import fn from './';

test.cb('precompile Nunjucks templates', t => {
	const stream = fn();

	stream.on('data', file => {
		t.is(file.path, path.join(__dirname, 'fixture', 'fixture.js'));
		t.is(file.relative, 'fixture/fixture.js');
		t.regex(file.contents.toString(), /nunjucksPrecompiled/);
		t.regex(file.contents.toString(), /"fixture\/fixture\.html"/);
		t.end();
	});

	stream.write(new gutil.File({
		base: __dirname,
		path: path.join(__dirname, 'fixture', 'fixture.html'),
		contents: new Buffer('<h1>{{ test }}</h1>')
	}));
});

test.cb('support supplying custom name in a callback', t => {
	const stream = fn({
		name: () => 'custom'
	});

	stream.on('data', file => {
		t.regex(file.contents.toString(), /{}\)\["custom"\]/);
		t.end();
	});

	stream.write(new gutil.File({
		base: __dirname,
		path: path.join(__dirname, 'fixture', 'fixture.html'),
		contents: new Buffer('<h1>{{ test }}</h1>')
	}));
});

test.cb('compile Nunjucks templates', t => {
	const stream = fn.compile({people: ['foo', 'bar']});

	stream.on('data', file => {
		t.is(file.contents.toString(), '<li>foo</li><li>bar</li>');
		t.end();
	});

	stream.write(new gutil.File({
		contents: new Buffer('{% for name in people %}<li>{{ name }}</li>{% endfor %}')
	}));
});

test.cb('support data via gulp-data', t => {
	const dl = [];

	const stream = data(file => ({
		dd: file.path,
		dt: 'path'
	}));

	stream.pipe(fn.compile());

	stream.on('data', file => {
		dl.push(file.contents.toString());
	});

	stream.on('end', () => {
		t.is(dl.sort().join(''), '<dt>path</dt><dd>bar.txt</dd><dt>path</dt><dd>foo.txt</dd>');
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

test.cb('extend gulp-data and data parameter', t => {
	const stream = data(() => ({
		people: ['foo', 'bar'],
		nested: {a: 'one', b: 'two'}
	}));

	stream.pipe(fn.compile({
		heading: 'people',
		nested: {a: 'three'}
	}));

	stream.on('data', data => {
		t.is(data.contents.toString(), '<h1>people</h1><li>foo</li><li>bar</li>one,two');
		t.end();
	});

	stream.write(new gutil.File({
		contents: new Buffer('<h1>{{ heading }}</h1>{% for name in people %}<li>{{ name }}</li>{% endfor %}{{ nested.a }},{{ nested.b }}')
	}));
});

test.cb('not alter gulp-data or data parameter', t => {
	const files = [];

	const stream = data(file => ({
		contents: file.contents.toString()
	}));

	const parameter = {
		foo: 'foo',
		bar: 'bar',
		foobar: ['foo', 'bar']
	};

	stream.pipe(fn.compile(parameter));

	stream.on('data', file => {
		files.push(file);
	});

	stream.on('end', () => {
		t.deepEqual(files[0].data, {contents: 'foo'});
		t.deepEqual(parameter, {
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

test.cb('support custom environment', t => {
	const nunjucksModule = require('nunjucks');
	const env = new nunjucksModule.Environment();

	env.addFilter('shorten', x => x.slice(0, 5));

	const stream = fn.compile({message: 'Lorem ipsum'}, {env});

	stream.on('data', file => {
		t.is(file.contents.toString(), 'Lorem');
		t.end();
	});

	stream.write(new gutil.File({
		contents: new Buffer('{{ message|shorten }}')
	}));
});

test.cb('support custom environment options', t => {
	const stream = fn.compile({message: '<span>Lorem ipsum</span>'}, {autoescape: false});

	stream.on('data', file => {
		t.is(file.contents.toString(), '<span>Lorem ipsum</span>');
		t.end();
	});

	stream.write(new gutil.File({
		contents: new Buffer('{{ message }}')
	}));
});
