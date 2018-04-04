# gulp-nunjucks [![Build Status](https://travis-ci.org/sindresorhus/gulp-nunjucks.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-nunjucks)

> Compile/precompile [Nunjucks](https://mozilla.github.io/nunjucks/) templates

*Issues with the output should be reported on the Nunjucks [issue tracker](https://github.com/mozilla/nunjucks/issues).*


## Install

```
$ npm install --save-dev gulp-nunjucks
```


## Usage

### Compile

```js
const gulp = require('gulp');
const nunjucks = require('gulp-nunjucks');

gulp.task('default', () =>
	gulp.src('templates/greeting.html')
		.pipe(nunjucks.compile({name: 'Sindre'}))
		.pipe(gulp.dest('dist'))
);
```

You can alternatively use [gulp-data](https://github.com/colynb/gulp-data) to inject the data:

```js
const gulp = require('gulp');
const nunjucks = require('gulp-nunjucks');
const data = require('gulp-data');

gulp.task('default', () =>
	gulp.src('templates/greeting.html')
		.pipe(data(() => ({name: 'Sindre'})))
		.pipe(nunjucks.compile())
		.pipe(gulp.dest('dist'))
);
```

### Precompile

```js
const gulp = require('gulp');
const nunjucks = require('gulp-nunjucks');

gulp.task('default', () =>
	gulp.src('templates/greeting.html')
		.pipe(nunjucks.precompile())
		.pipe(gulp.dest('dist'))
);
```


## API

### nunjucks.compile([data], [options])

Compile a template using the provided `data`.

#### data

Type: `Object`

The data object used to populate the text.

#### options

Type: `Object`

Options will be passed directly to the Nunjucks [Environment constructor](https://mozilla.github.io/nunjucks/api.html#constructor) which will be used to compile templates.

##### options.env

Type: `nunjucks.Environment`<br>
Default: `new nunjucks.Environment()`

The custom Nunjucks [Environment object](https://mozilla.github.io/nunjucks/api.html#environment) which will be used to compile templates. If supplied, the rest of `options` will be ignored.

##### options.filters

Type: `Object`

An object containing [custom filters](https://mozilla.github.io/nunjucks/api.html#custom-filters) that will be passed to Nunjucks, with the filter's name as key and the filter function as value.

Example:

```js
{
	'shorten': str => str.slice(0, 5),
	'round': num => Math.round(num)
}
```

### nunjucks.precompile([options])

Precompile a template for rendering dynamically at a later time.

Same options as [`nunjucks.precompile()`](https://mozilla.github.io/nunjucks/api.html#precompile) except for `name`.

#### options

Type: `Object`

##### name

Type: `Function`<br>
Default: Relative template path<br>
Example: `templates/list.html`

You can override the default behavior by supplying a function which gets the current [File](https://github.com/gulpjs/vinyl#options) object and is expected to return the name.

Example:

```js
{
	name: file => `tpl-${file.relative}`
}
```


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
