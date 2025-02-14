'use strict'

const tape = require('tape')
const tapePromise = require('tape-promise').default
const LinkHeader = require('http-link-header')

const {
	stationA, stationB,
	unmocked,
	fetchWithTestApi,
} = require('./util')

const test = tapePromise(tape)

test('/ & basic headers', async(t) => {
	const {headers: h, data} = await fetchWithTestApi({}, {}, '/', {
		headers: {accept: 'application/json'},
	})
	t.equal(h['x-powered-by'], 'test 1.2.3a http://example.org')
	t.equal(h['access-control-allow-origin'], '*')
	t.equal(h['strict-transport-security'], 'max-age=864000; includeSubDomains')
	t.equal(h['x-content-type-options'], 'nosniff')
	t.equal(h['content-security-policy'], `default-src 'none'`)
	t.equal(h['x-api-version'], '1.2.3a')
	t.equal(h['content-type'] ,'application/json; charset=utf-8')
	t.ok(h['content-length'])
	t.ok(h['etag'])

	t.equal(data.stopUrl, '/stops{/id}{?linesOfStops,language,pretty}')

	const {headers: h2} = await fetchWithTestApi({}, {
		cors: false,
		etags: 'strong',
	}, '/', {
		headers: {accept: 'application/json'},
	})
	t.notOk(h2['access-control-allow-origin'])
	t.ok(h2['etag'])
	t.notOk(h2['etag'].slice(0, 2) === 'W/')
	t.end()
})

test('/stop/:id', async(t) => {
	const mockHafas = {
		stop: (id) => {
			if (id !== stationA.id) throw new Error('stop() called with invalid ID')
			return Promise.resolve(stationA)
		}
	}

	const path = '/stops/' + stationA.id
	const {data} = await fetchWithTestApi(mockHafas, {}, path)
	t.deepEqual(data, stationA)
	t.end()
})

test('/locations/nearby', async(t) => {
	const mockHafas = {
		nearby: (loc) => {
			if (loc.latitude !== 123) throw new Error('nearby() called with invalid latitude')
			if (loc.longitude !== 321) throw new Error('nearby() called with invalid longitude')
			return Promise.resolve([stationA, stationB])
		}
	}

	const path = '/locations/nearby?latitude=123&longitude=321'
	const {data} = await fetchWithTestApi(mockHafas, {}, path)
	t.deepEqual(data, [stationA, stationB])
	t.end()
})

test('/journeys with POI', async(t) => {
	// fake data
	const someJourney = {_: Math.random().toString(16).slice(2)}
	const earlierRef = 'some-earlier-ref'
	const laterRef = 'some-later-ref'

	const mockHafas = {
		journeys: async (from, to) => {
			t.equal(from, '123')
			t.deepEqual(to, {
				type: 'location',
				id: '321',
				poi: true,
				name: 'Foo',
				latitude: 1.23,
				longitude: 3.21
			})
			return {
				earlierRef, laterRef,
				journeys: [someJourney]
			}
		}
	}

	const query = '?from=123&to.id=321&to.name=Foo&to.latitude=1.23&to.longitude=3.21&foo=bar'
	const path = '/journeys' + query
	const {data, headers: h} = await fetchWithTestApi(mockHafas, {}, path)

	t.deepEqual(data.journeys, [someJourney])
	t.equal(data.earlierRef, earlierRef)
	t.equal(data.laterRef, laterRef)

	t.ok(h.link)
	const l = LinkHeader.parse(h.link)
	t.deepEqual(l.refs, [{
		rel: 'prev',
		uri: '?foo=bar&earlierThan=some-earlier-ref',
	}, {
		rel: 'next',
		uri: '?foo=bar&laterThan=some-later-ref',
	}])
	t.end()
})

// todo
