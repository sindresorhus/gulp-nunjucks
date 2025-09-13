import {Buffer} from 'node:buffer';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import test from 'ava';
import {pEvent} from 'p-event';
import data from 'gulp-data';
import Vinyl from 'vinyl';
import nunjucksModule from 'nunjucks';
import {nunjucksCompile, nunjucksPrecompile} from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('precompile Nunjucks templates', async t => {
	const stream = nunjucksPrecompile();
	const promise = pEvent(stream, 'data');

	stream.end(new Vinyl({
		base: __dirname,
		path: path.join(__dirname, 'fixture', 'fixture.html'),
		contents: Buffer.from('<h1>{{ test }}</h1>'),
	}));

	const file = await promise;

	t.is(file.path, path.join(__dirname, 'fixture', 'fixture.js'));
	t.is(file.relative, path.join('fixture', 'fixture.js'));
	t.regex(file.contents.toString(), /nunjucksPrecompiled/);
	t.regex(file.contents.toString(), /"fixture\/fixture\.html"/);
});

test('compile Nunjucks templates', async t => {
	const stream = nunjucksCompile({people: ['foo', 'bar']});
	const promise = pEvent(stream, 'data');

	stream.end(new Vinyl({
		base: __dirname,
		path: path.join(__dirname, 'fixture', 'fixture.njk'),
		contents: Buffer.from('{% for name in people %}<li>{{ name }}</li>{% endfor %}'),
	}));

	const file = await promise;

	t.is(file.relative, path.join('fixture', 'fixture.html'));
	t.is(file.contents.toString(), '<li>foo</li><li>bar</li>');
});

test('support supplying custom name in a callback', async t => {
	const stream = nunjucksPrecompile({
		name: () => 'custom',
	});

	const promise = pEvent(stream, 'data');

	stream.end(new Vinyl({
		base: __dirname,
		path: path.join(__dirname, 'fixture', 'fixture.html'),
		contents: Buffer.from('<h1>{{ test }}</h1>'),
	}));

	const file = await promise;

	t.regex(file.contents.toString(), /{}\)\["custom"]/);
});

test('support data via gulp-data', async t => {
	const stream = data(file => ({
		dd: file.path,
		dt: 'path',
	}));

	const finalStream = stream.pipe(nunjucksCompile());
	const promise = finalStream.toArray();

	stream.write(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('<dt>{{ dt }}</dt><dd>{{ dd }}</dd>'),
	}));

	stream.write(new Vinyl({
		path: 'bar.txt',
		contents: Buffer.from('<dt>{{ dt }}</dt><dd>{{ dd }}</dd>'),
	}));

	stream.end();

	const files = await promise;

	t.deepEqual(
		files.map(file => file.contents.toString()).sort(),
		['<dt>path</dt><dd>bar.txt</dd>', '<dt>path</dt><dd>foo.txt</dd>'].sort(),
	);
});

test('extend gulp-data and data parameter', async t => {
	const stream = data(() => ({
		people: ['foo', 'bar'],
		nested: {a: 'one', b: 'two'},
	}));

	const finalStream = stream.pipe(nunjucksCompile({
		heading: 'people',
		nested: {a: 'three'},
	}));

	const promise = finalStream.toArray();

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('<h1>{{ heading }}</h1>{% for name in people %}<li>{{ name }}</li>{% endfor %}{{ nested.a }},{{ nested.b }}'),
	}));

	const file = await promise;

	t.is(file[0].contents.toString(), '<h1>people</h1><li>foo</li><li>bar</li>one,two');
});

test('not alter gulp-data or data parameter', async t => {
	const stream = data(file => ({
		contents: file.contents.toString(),
	}));

	const parameter = {
		foo: 'foo',
		bar: 'bar',
		foobar: ['foo', 'bar'],
	};

	const finalStream = stream.pipe(nunjucksCompile(parameter));
	const promise = finalStream.toArray();

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('foo'),
	}));

	const files = await promise;

	t.deepEqual(files[0].data, {contents: 'foo'});

	t.deepEqual(parameter, {
		foo: 'foo',
		bar: 'bar',
		foobar: ['foo', 'bar'],
	});
});

test('support custom environment', async t => {
	const env = new nunjucksModule.Environment();

	env.addFilter('shorten', x => x.slice(0, 5));

	const stream = nunjucksCompile({message: 'Lorem ipsum'}, {env});
	const promise = pEvent(stream, 'data');

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('{{ message|shorten }}'),
	}));

	const file = await promise;

	t.is(file.contents.toString(), 'Lorem');
});

test('support custom environment options', async t => {
	const stream = nunjucksCompile({message: '<span>Lorem ipsum</span>'}, {autoescape: false});
	const promise = pEvent(stream, 'data');

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('{{ message }}'),
	}));

	const file = await promise;

	t.is(file.contents.toString(), '<span>Lorem ipsum</span>');
});

test('support custom filters', async t => {
	const filters = {shorten: x => x.slice(0, 5), shout: x => `${x}!`};
	const stream = nunjucksCompile({message: 'Lorem ipsum'}, {filters});
	const promise = pEvent(stream, 'data');

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('{{ message|shorten|shout }}'),
	}));

	const file = await promise;

	t.is(file.contents.toString(), 'Lorem!');
});

test('support async custom filters', async t => {
	const filters = {shorten: async x => x.slice(0, 5), shout: async x => `${x}!`};
	const stream = nunjucksCompile({message: 'Lorem ipsum'}, {filters});
	const promise = pEvent(stream, 'data');

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('{{ message|shorten|shout }}'),
	}));

	const file = await promise;

	t.is(file.contents.toString(), 'Lorem!');
});

test('not pass custom filters to custom environment', async t => {
	t.plan(2);

	const env = new nunjucksModule.Environment();
	env.addFilter('shorten', x => x.slice(0, 5));
	const filters = {shout: x => `${x}!`};
	const stream = nunjucksCompile({message: 'Lorem ipsum'}, {env, filters});
	const promise = pEvent(stream);

	stream.end(new Vinyl({
		contents: Buffer.from('{{ message|shorten|shout }}'),
	}));

	try {
		await promise;
	} catch (error) {
		t.regex(error.message, /filter not found: shout/);
		t.notRegex(error.message, /shorten/);
	}
});

test('support async templates with asyncEach tag', async t => {
	const env = new nunjucksModule.Environment(null, {async: true});
	const stream = nunjucksCompile({items: ['a', 'b', 'c']}, {env});
	const promise = pEvent(stream, 'data');

	stream.end(new Vinyl({
		path: 'async.njk',
		contents: Buffer.from('{% asyncEach item in items %}{{ item }}{% endeach %}'),
	}));

	const file = await promise;
	t.is(file.contents.toString(), 'abc');
});

test('support custom extensions', async t => {
	function UppercaseExtension() {
		this.tags = ['uppercase'];

		this.parse = function (parser, nodes) {
			const token = parser.nextToken();
			parser.advanceAfterBlockEnd(token.value);
			const body = parser.parseUntilBlocks('enduppercase');
			parser.advanceAfterBlockEnd();
			return new nodes.CallExtension(this, 'run', null, [body]);
		};

		this.run = function (context, content) {
			return content().toUpperCase();
		};
	}

	const extensions = {UppercaseExtension: new UppercaseExtension()};
	const stream = nunjucksCompile({message: 'Hello World'}, {extensions});
	const promise = pEvent(stream, 'data');

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('{% uppercase %}{{ message }}{% enduppercase %}'),
	}));

	const file = await promise;
	t.is(file.contents.toString(), 'HELLO WORLD');
});

test('support multiple extensions', async t => {
	function UppercaseExtension() {
		this.tags = ['uppercase'];

		this.parse = function (parser, nodes) {
			const token = parser.nextToken();
			parser.advanceAfterBlockEnd(token.value);
			const body = parser.parseUntilBlocks('enduppercase');
			parser.advanceAfterBlockEnd();
			return new nodes.CallExtension(this, 'run', null, [body]);
		};

		this.run = function (context, content) {
			return content().toUpperCase();
		};
	}

	function ReverseExtension() {
		this.tags = ['reverse'];

		this.parse = function (parser, nodes) {
			const token = parser.nextToken();
			parser.advanceAfterBlockEnd(token.value);
			const body = parser.parseUntilBlocks('endreverse');
			parser.advanceAfterBlockEnd();
			return new nodes.CallExtension(this, 'run', null, [body]);
		};

		this.run = function (context, content) {
			return [...content()].reverse().join('');
		};
	}

	const extensions = {
		UppercaseExtension: new UppercaseExtension(),
		ReverseExtension: new ReverseExtension(),
	};

	const stream = nunjucksCompile({text: 'hello'}, {extensions});
	const promise = pEvent(stream, 'data');

	stream.end(new Vinyl({
		path: 'foo.txt',
		contents: Buffer.from('{% uppercase %}{% reverse %}{{ text }}{% endreverse %}{% enduppercase %}'),
	}));

	const file = await promise;
	t.is(file.contents.toString(), 'OLLEH');
});

test('not pass custom extensions to custom environment', async t => {
	function TestExtension() {
		this.tags = ['test'];

		this.parse = function (parser, nodes) {
			const token = parser.nextToken();
			parser.advanceAfterBlockEnd(token.value);
			const body = parser.parseUntilBlocks('endtest');
			parser.advanceAfterBlockEnd();
			return new nodes.CallExtension(this, 'run', null, [body]);
		};

		this.run = function () {
			return 'TEST';
		};
	}

	const env = new nunjucksModule.Environment();
	const extensions = {TestExtension: new TestExtension()};
	const stream = nunjucksCompile({}, {env, extensions});
	const promise = pEvent(stream);

	stream.end(new Vinyl({
		contents: Buffer.from('{% test %}content{% endtest %}'),
	}));

	try {
		await promise;
		t.fail('Should have thrown an error');
	} catch (error) {
		t.regex(error.message, /unknown block tag: test/);
	}
});
