import {Buffer} from 'node:buffer';
import {promisify} from 'node:util';
import nunjucks from 'nunjucks';
import {gulpPlugin} from 'gulp-plugin-extras';

export function nunjucksCompile(data, options = {}) {
	return gulpPlugin('gulp-nunjucks', async file => {
		const context = {
			...data,
			...file.data,
		};

		const env = options.env ?? new nunjucks.Environment(new nunjucks.FileSystemLoader(file.base), options);

		if (options.filters && !options.env) {
			for (const [key, filter] of Object.entries(options.filters)) {
				env.addFilter(key, async (...arguments_) => {
					const cb = arguments_.pop();
					try {
						const result = await filter(...arguments_);
						cb(undefined, result);
					} catch (error) {
						cb(error);
					}
				}, true);
			}
		}

		file.contents = Buffer.from(await promisify(env.renderString.bind(env))(file.contents.toString(), context));
		file.extname = '.html';

		return file;
	});
}

export function nunjucksPrecompile(options) {
	return gulpPlugin('gulp-nunjucks', file => {
		const localOptions = {...options};
		localOptions.name = (typeof localOptions.name === 'function' && localOptions.name(file)) || file.relative;
		file.contents = Buffer.from(nunjucks.precompileString(file.contents.toString(), localOptions));
		file.extname = '.js';
		return file;
	});
}
