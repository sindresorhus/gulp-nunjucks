import path from 'path';
import test from 'ava';
import data from 'gulp-data';
import Vinyl from 'vinyl';
import nunjucks from '.';

test.cb('precompile Nunjucks templates', t => {
	const stream = nunjucks();

	stream.on('data', file => {
		t.is(file.path, path.join(__dirname, 'fixture', 'fixture.js'));
		t.is(file.relative, path.join('fixture', 'fixture.js'));
		t.regex(file.contents.toString(), /nunjucksPrecompiled/);
		t.regex(file.contents.toString(), /"fixture\/fixture\.html"/);
		t.end();
	});

	stream.end(new Vinyl({
		base: __dirname,
		path: path.join(__dirname, 'fixture', 'fixture.html'),
		contents: Buffer.from('<h1>{{ test }}</h1>')
	}));
});

test.cb('compile Nunjucks templates', t => {
	const stream = nunjucks.compile({people: ['foo', 'bar']});

	stream.on('data', file => {
		t.is(file.relative, path.join('fixture', 'fixture.html'));
		t.is(file.contents.toString(), '<li>foo</li><li>bar</li>');
		t.end();
	});

	stream.end(new Vinyl({
		base: __dirname,
		path: path.join(__dirname, 'fixture', 'fixture.njk'),
		contents: Buffer.from('{% for name in people %}<li>{{ name }}</li>{% endfor %}')
	}));
});

test.cb('support supplying custom name in a callback', t => {
	const stream = nunjucks({
		name: () => 'custom'
	});

	stream.on('data', file => {
		t.regex(file.contents.toString(), /{}\)\["custom"]/);
		t.end();
	});

	stream.end(new Vinyl({
		base: __dirname,
		path: path.join(__dirname, 'fixture', 'fixture.html'),
		contents: Buffer.from('<h1>{{ test }}</h1>')
	}));
});

test.cb('support data via gulp-data', t => {
	const dl = [];

	const stream = data(file => ({
		dd: file.path,
		dt: 'path'
	}));

	stream.pipe(nunjucks.compile());

	stream.on('data', file => {
		dl.push(file.contents.toString());
	});

	stream.on('end', () => {
		t.is(dl.sort().join(''), '<dt>path</dt><dd>bar.txt</dd><dt>path</dt><dd>foo.txt</dd>');
		t.end();
	});

	stream.write(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('<dt>{{ dt }}</dt><dd>{{ dd }}</dd>')
	}));

	stream.write(new Vinyl({
		path: 'bar.txt',
		contents: Buffer.from('<dt>{{ dt }}</dt><dd>{{ dd }}</dd>')
	}));

	stream.end();
});

test.cb('extend gulp-data and data parameter', t => {
	const stream = data(() => ({
		people: ['foo', 'bar'],
		nested: {a: 'one', b: 'two'}
	}));

	stream.pipe(nunjucks.compile({
		heading: 'people',
		nested: {a: 'three'}
	}));

	stream.on('data', data => {
		t.is(data.contents.toString(), '<h1>people</h1><li>foo</li><li>bar</li>one,two');
		t.end();
	});

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('<h1>{{ heading }}</h1>{% for name in people %}<li>{{ name }}</li>{% endfor %}{{ nested.a }},{{ nested.b }}')
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

	stream.pipe(nunjucks.compile(parameter));

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

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('foo')
	}));
});

test.cb('support custom environment', t => {
	const nunjucksModule = require('nunjucks');

	const env = new nunjucksModule.Environment();

	env.addFilter('shorten', x => x.slice(0, 5));

	const stream = nunjucks.compile({message: 'Lorem ipsum'}, {env});

	stream.on('data', file => {
		t.is(file.contents.toString(), 'Lorem');
		t.end();
	});

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('{{ message|shorten }}')
	}));
});

test.cb('support custom environment options', t => {
	const stream = nunjucks.compile({message: '<span>Lorem ipsum</span>'}, {autoescape: false});

	stream.on('data', file => {
		t.is(file.contents.toString(), '<span>Lorem ipsum</span>');
		t.end();
	});

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('{{ message }}')
	}));
});

test.cb('support custom filters', t => {
	const filters = {shorten: x => x.slice(0, 5), shout: x => `${x}!`};

	const stream = nunjucks.compile({message: 'Lorem ipsum'}, {filters});

	stream.on('data', file => {
		t.is(file.contents.toString(), 'Lorem!');
		t.end();
	});

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('{{ message|shorten|shout }}')
	}));
});

test.cb('support async custom filters', t => {
	const filters = {shorten: async x => x.slice(0, 5), shout: async x => `${x}!`};

	const stream = nunjucks.compile({message: 'Lorem ipsum'}, {filters});

	stream.on('data', file => {
		t.is(file.contents.toString(), 'Lorem!');
		t.end();
	});

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('{{ message|shorten|shout }}')
	}));
});

test.cb('not pass custom filters to custom environment', t => {
	const nunjucksModule = require('nunjucks');

	const env = new nunjucksModule.Environment();

	env.addFilter('shorten', x => x.slice(0, 5));

	const filters = {shout: x => `${x}!`};

	const stream = nunjucks.compile({message: 'Lorem ipsum'}, {env, filters});

	stream.on('error', err => {
		t.regex(err.message, /filter not found: shout/);
		t.notRegex(err.message, /shorten/);
		t.end();
	});

	stream.end(new Vinyl({
		contents: Buffer.from('{{ message|shorten|shout }}')
	}));
});
