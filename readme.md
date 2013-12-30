# [gulp](https://github.com/wearefractal/gulp)-nunjucks [![Build Status](https://secure.travis-ci.org/sindresorhus/gulp-nunjucks.png?branch=master)](http://travis-ci.org/sindresorhus/gulp-nunjucks)

> Precompile [Nunjucks](http://jlongster.github.io/nunjucks/) templates

*Issues with the output should be reported on the Nunjucks [issue tracker](https://github.com/jlongster/nunjucks/issues).*


## Install

Install with [npm](https://npmjs.org/package/gulp-nunjucks)

```
npm install --save-dev gulp-nunjucks
```


## Example

```js
var gulp = require('gulp');
var nunjucks = require('gulp-nunjucks');

gulp.task('default', function () {
	gulp.src('src/template.html')
		.pipe(nunjucks())
		.pipe(gulp.dest('dist'));
});
```


## API

### nunjucks(options)

Same options as [nunjucks.precompile()](http://jlongster.github.io/nunjucks/api.html#precompile).


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
