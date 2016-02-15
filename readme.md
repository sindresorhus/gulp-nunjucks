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

gulp.task('default', () => {
	return gulp.src('templates/greeting.html')
		.pipe(nunjucks.compile({name: 'Sindre'}))
		.pipe(gulp.dest('dist'));
});
```

You can alternatively use [gulp-data](https://github.com/colynb/gulp-data) to inject the data:

```js
const gulp = require('gulp');
const nunjucks = require('gulp-nunjucks');
const data = require('gulp-data');

gulp.task('default', () => {
	return gulp.src('templates/greeting.html')
		.pipe(data(() => {
			return {name: 'Sindre'};
		}))
		.pipe(nunjucks.compile())
		.pipe(gulp.dest('dist'));
});
```

### Precompile

```js
const gulp = require('gulp');
const nunjucks = require('gulp-nunjucks');

gulp.task('default', () => {
	return gulp.src('templates/greeting.html')
		.pipe(nunjucks.precompile())
		.pipe(gulp.dest('dist'));
});
```


## API

### nunjucks.compile([data], [options])

Compile a template using the provided `data`.

#### data

Type: `object`

The data object used to populate the text.

#### options

Type: `object`

Options will be passed directly to Nunjucks [Environment object constructor](https://mozilla.github.io/nunjucks/api.html#constructor) which will be used to compile templates.

##### options.env

Type: `nunjucks.Environment`  
Default: *`new nunjucks.Environment()`*

The custom Nunjucks [Environment object](https://mozilla.github.io/nunjucks/api.html#environment) which will be used to compile templates. If supplied, the rest of `options` will be ignored.

### nunjucks.precompile([options])

Precompile a template for rendering dynamically at a later time.

Same options as [`nunjucks.precompile()`](https://mozilla.github.io/nunjucks/api.html#precompile) except for `name`.

#### options.name

Type: `function`  
Default: *Relative template path. Example: `templates/list.html`*

You can override the default behavior by supplying a function which gets the current [File](https://github.com/wearefractal/vinyl#constructoroptions) object and is expected to return the name.

Example:

```js
{
	name: file => `tpl-${file.relative}`
}
```


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
