'use strict'

const {
	parseWhen,
	parseStop,
	parseInteger,
	parseBoolean,
	parseString,
	parseQuery,
	parseProducts
} = require('../lib/parse')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const createRoute = (hafas, config) => {
	const parsers = {
		when: parseWhen(hafas.profile.timezone),
		direction: parseStop,
		duration: parseInteger,
		results: parseInteger,
		linesOfStops: parseBoolean,
		remarks: parseBoolean,
		language: parseString
	}
	if (hafas.profile.departuresStbFltrEquiv !== false) {
		parsers.includeRelatedStations = parseBoolean
	}
	if (hafas.profile.departuresGetPasslist !== false) {
		parsers.stopovers = parseBoolean
	}

	const departures = (req, res, next) => {
		const id = parseStop('id', req.params.id)

		const opt = parseQuery(parsers, req.query)
		opt.products = parseProducts(hafas.profile.products, req.query)
		config.addHafasOpts(opt, 'departures', req)

		hafas.departures(id, opt)
		.then((deps) => {
			res.json(deps)
			next()
		})
		.catch(next)
	}

	departures.cache = false
	departures.pathParameters = [
		'id',
	]
	departures.queryParameters = [
		...hafas.profile.products.map(p => p.id),
		...Object.keys(parsers),
	]
	return departures
}

module.exports = createRoute
