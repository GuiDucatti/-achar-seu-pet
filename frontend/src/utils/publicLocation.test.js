import assert from 'node:assert/strict'
import test from 'node:test'
import { parseCoordinatePair, parsePublicLocation } from './publicLocation.js'

test('rejects absent and non-finite coordinates instead of converting them to zero', () => {
  for (const value of [null, undefined, '', Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(parseCoordinatePair(value, value), null)
  }
})

test('rejects coordinates outside geographic boundaries', () => {
  assert.equal(parseCoordinatePair(-90.1, 0), null)
  assert.equal(parseCoordinatePair(90.1, 0), null)
  assert.equal(parseCoordinatePair(0, -180.1), null)
  assert.equal(parseCoordinatePair(0, 180.1), null)
})

test('accepts valid coordinate boundaries', () => {
  assert.deepEqual(parseCoordinatePair(-90, -180), {
    latitude: -90,
    longitude: -180,
  })
  assert.deepEqual(parseCoordinatePair(90, 180), {
    latitude: 90,
    longitude: 180,
  })
})

test('requires a positive finite radius for a public location', () => {
  assert.equal(
    parsePublicLocation({ latitude: -21.29, longitude: -50.34, raio_metros: null }),
    null,
  )
  assert.equal(
    parsePublicLocation({ latitude: -21.29, longitude: -50.34, raio_metros: 0 }),
    null,
  )
  assert.deepEqual(
    parsePublicLocation({ latitude: '-21.29', longitude: '-50.34', raio_metros: '1500' }),
    { latitude: -21.29, longitude: -50.34, radius: 1500 },
  )
})
