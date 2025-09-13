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

		if (options.extensions && !options.env) {
			for (const [key, extension] of Object.entries(options.extensions)) {
				env.addExtension(key, extension);
			}
		}

		try {
			file.contents = Buffer.from(await promisify(env.renderString.bind(env))(file.contents.toString(), context));
		} catch (error) {
			// Improve Nunjucks template error messages
			if (error.message.includes('template not found:')) {
				const templateName = error.message.match(/template not found: (.+)/)?.[1];
				const cleanError = new Error(`Template not found: ${templateName}`);
				cleanError.name = 'NunjucksTemplateError';
				throw cleanError;
			}

			// For other template errors, provide cleaner messages
			if (error.name === 'Template render error') {
				const cleanError = new Error(error.message.split('\n').at(-1).trim());
				cleanError.name = 'NunjucksTemplateError';
				throw cleanError;
			}

			throw error;
		}

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
