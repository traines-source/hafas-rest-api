import {
	parseBoolean,
} from '../lib/parse.js'

const formatProductParams = (products) => {
	const params = Object.create(null)
	for (const p of products) {
		let name = p.name
		if (p.short && p.short !== p.name) name += ` (${p.short})`
		params[p.id] = {
			description: `Include ${name}?`,
			type: 'boolean',
			default: p.default === true,
			parse: parseBoolean,
		}
	}
	return params
}

const formatProductsAsOpenapiParameters = (products) => {
	const schema = formatProductParams(products);
	for (let s in schema) {
		delete schema[s].parse;
	}
	return {
		type: 'object',
		properties: schema
	}
}

const profileSpecificProductsAsOpenapiParameters = () => {
	return {
		name: 'products',
		in: 'query',
		description: 'Filter by profile-specific products (e.g. regional transport only).',
		schema: {'$ref': '#/components/schemas/ProfileSpecificProducts'}
	}
}

export {
	formatProductParams,
	formatProductsAsOpenapiParameters,
	profileSpecificProductsAsOpenapiParameters
}
