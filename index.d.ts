import type {Transform} from 'node:stream';
import type {File} from 'vinyl';
import type {Environment} from 'nunjucks';

export type NunjucksCompileOptions = {
	/**
	Additional options passed to the Nunjucks Environment constructor.
	*/
	[key: string]: unknown;

	/**
	The custom Nunjucks Environment object which will be used to compile templates.
	If supplied, the rest of options will be ignored.
	*/
	env?: Environment;

	/**
	An object containing custom filters that will be passed to Nunjucks.
	*/
	filters?: Record<string, (...arguments_: unknown[]) => unknown>;

	/**
	An object containing custom tags/extensions that will be passed to Nunjucks.
	*/
	extensions?: Record<string, unknown>;
};

export type NunjucksPrecompileOptions = {
	/**
	Additional options passed to nunjucks.precompile().
	*/
	[key: string]: unknown;

	/**
	Override the default template name behavior by supplying a function
	which gets the current File object and is expected to return the name.
	*/
	name?: (file: File) => string;
};

/**
Compile a template using the provided data.

@param data - The data object used to populate the text.
@param options - Options passed to Nunjucks Environment constructor.
*/
export function nunjucksCompile(data?: Record<string, unknown>, options?: NunjucksCompileOptions): Transform;

/**
Precompile a template for rendering dynamically at a later time.

@param options - Options passed to nunjucks.precompile().
*/
export function nunjucksPrecompile(options?: NunjucksPrecompileOptions): Transform;
