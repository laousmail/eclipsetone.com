import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchWithRetry } from './spotify-api.mjs'

function mockResponse(status, body = '') {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => body,
  }
}

test('fetchWithRetry retries network-level throws then succeeds', async () => {
  let calls = 0
  const waits = []
  const fetchFn = async () => {
    calls += 1
    if (calls < 3) throw new TypeError('fetch failed')
    return mockResponse(200)
  }
  const res = await fetchWithRetry(
    'https://example.test',
    {},
    { retries: 3, fetchFn, sleepFn: async (ms) => waits.push(ms) },
  )
  assert.equal(res.status, 200)
  assert.equal(calls, 3)
  assert.deepEqual(waits, [500, 1000])
})

test('fetchWithRetry does not retry non-retryable HTTP status like 401', async () => {
  let calls = 0
  const fetchFn = async () => {
    calls += 1
    return mockResponse(401, 'unauthorized')
  }
  await assert.rejects(
    () => fetchWithRetry('https://example.test/token', {}, { retries: 3, fetchFn, sleepFn: async () => {} }),
    /401/,
  )
  assert.equal(calls, 1)
})

test('fetchWithRetry still retries 429/5xx', async () => {
  let calls = 0
  const fetchFn = async () => {
    calls += 1
    if (calls === 1) return mockResponse(503, 'busy')
    return mockResponse(200)
  }
  const res = await fetchWithRetry(
    'https://example.test',
    {},
    { retries: 3, fetchFn, sleepFn: async () => {} },
  )
  assert.equal(res.status, 200)
  assert.equal(calls, 2)
})
