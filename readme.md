# gulp-nunjucks

> Compile/precompile [Nunjucks](https://mozilla.github.io/nunjucks/) templates

*Issues with the output should be reported on the Nunjucks [issue tracker](https://github.com/mozilla/nunjucks/issues).*

## Install

```sh
npm install --save-dev gulp-nunjucks
```

## Usage

### Compile

```js
import gulp from 'gulp';
import {nunjucksCompile} from 'gulp-nunjucks';

export default () => (
	gulp.src('templates/greeting.html')
		.pipe(nunjucksCompile({name: 'Sindre'}))
		.pipe(gulp.dest('dist'))
);
```

You can alternatively use [gulp-data](https://github.com/colynb/gulp-data) to inject the data:

```js
import gulp from 'gulp';
import {nunjucksCompile} from 'gulp-nunjucks';
import data from 'gulp-data';

export default () => (
	gulp.src('templates/greeting.html')
		.pipe(data(() => ({name: 'Sindre'})))
		.pipe(nunjucksCompile())
		.pipe(gulp.dest('dist'))
);
```

### Precompile

```js
import gulp from 'gulp';
import {nunjucksPrecompile} from 'gulp-nunjucks';

export default () => (
	gulp.src('templates/greeting.html')
		.pipe(nunjucksPrecompile())
		.pipe(gulp.dest('dist'))
);
```

## API

### nunjucks.compile(data?, options?)

Compile a template using the provided `data`.

#### data

Type: `object`

The data object used to populate the text.

#### options

Type: `object`

Options will be passed directly to the Nunjucks [Environment constructor](https://mozilla.github.io/nunjucks/api.html#constructor) which will be used to compile templates.

##### options.env

Type: `nunjucks.Environment`\
Default: `new nunjucks.Environment()`

The custom Nunjucks [Environment object](https://mozilla.github.io/nunjucks/api.html#environment) which will be used to compile templates. If supplied, the rest of `options` will be ignored.

##### options.filters

Type: `object`

An object containing [custom filters](https://mozilla.github.io/nunjucks/api.html#custom-filters) that will be passed to Nunjucks, with the filter's name as key and the filter function as value.

Async filters should be defined as async functions. You cannot use just a promise-returning function.

```js
{
	'shorten': string => string.slice(0, 5),
	'round': number => Math.round(number),
	'fetch': async url => {
		const response = await fetch(url);
		const result = await response.text();
		return result;
	}
}
```

### nunjucks.precompile(options?)

Precompile a template for rendering dynamically at a later time.

Same options as [`nunjucks.precompile()`](https://mozilla.github.io/nunjucks/api.html#precompile) except for `name`.

#### options

Type: `object`

##### name

Type: `Function`\
Default: Relative template path\
Example: `templates/list.html`

You can override the default behavior by supplying a function which gets the current [File](https://github.com/gulpjs/vinyl#options) object and is expected to return the name.

Example:

```js
{
	name: file => `template-${file.relative}`
}
```
