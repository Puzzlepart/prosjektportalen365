import {
  collectPages,
  DEFAULT_TERM_PAGE_SIZE,
  IPagedResult,
  IPageResponse,
  IQueryParams,
  parsePagedResponse,
  readNextLink,
  readResultLimit,
  resolvePagedQuery
} from './paging'

/**
 * Minimal stand in for the HTTP layer: hands out the supplied pages in order and
 * records which `nextLink` each request was made with.
 */
function fakePages<T>(pages: IPagedResult<T>[]) {
  const requested: string[] = []
  const fetchPage = (nextLink?: string): Promise<IPagedResult<T>> => {
    requested.push(nextLink)
    const page = pages.shift()
    if (!page) {
      return Promise.reject(new Error('fetchPage called more times than there are pages'))
    }
    return Promise.resolve(page)
  }
  return { fetchPage, requested }
}

/**
 * Stand in for `Queryable.query`. Deliberately not a `URLSearchParams`, so that the
 * production code is pinned to the `{ get, set }` seam rather than to the concrete
 * type, and so that an absent parameter can answer `undefined` as well as `null`.
 */
function fakeQuery(initial: Record<string, string> = {}): IQueryParams & {
  values: Record<string, string>
} {
  const values: Record<string, string> = { ...initial }
  return {
    values,
    get: (name: string) => (name in values ? values[name] : null),
    set: (name: string, value: string) => {
      values[name] = value
    }
  }
}

/**
 * Stand in for a `fetch` `Response`, covering the empty body cases `DefaultParse`
 * guards against.
 */
function fakeResponse(body: string, init: { status?: number; contentLength?: string } = {}) {
  const headers = new Map<string, string>()
  if (init.contentLength !== undefined) headers.set('Content-Length', init.contentLength)
  let reads = 0
  const response: IPageResponse & { reads: () => number } = {
    status: init.status ?? 200,
    headers: {
      has: (name: string) => headers.has(name),
      get: (name: string) => (headers.has(name) ? headers.get(name) : null)
    },
    text: () => {
      reads++
      return Promise.resolve(body)
    },
    reads: () => reads
  }
  return response
}

describe('readNextLink', () => {
  it('reads the OData v4 annotation the term store returns', () => {
    expect(readNextLink({ value: [], '@odata.nextLink': 'https://c/next' })).toBe('https://c/next')
  })

  it('reads the unprefixed annotation used by minimal metadata responses', () => {
    expect(readNextLink({ value: [], 'odata.nextLink': 'https://c/next' })).toBe('https://c/next')
  })

  it('returns undefined for the last page', () => {
    expect(readNextLink({ value: [] })).toBeUndefined()
    expect(readNextLink({ '@odata.nextLink': '' })).toBeUndefined()
    expect(readNextLink(null)).toBeUndefined()
    expect(readNextLink('not json')).toBeUndefined()
  })
})

describe('parsePagedResponse', () => {
  it('reads the values and the next link out of a page', async () => {
    const response = fakeResponse(
      JSON.stringify({ value: [{ id: 'a' }, { id: 'b' }], '@odata.nextLink': 'https://c/p2' })
    )
    expect(await parsePagedResponse(response)).toEqual({
      value: [{ id: 'a' }, { id: 'b' }],
      nextLink: 'https://c/p2'
    })
  })

  it('returns an empty page for a 204, without touching the body', async () => {
    const response = fakeResponse('', { status: 204 })
    expect(await parsePagedResponse(response)).toEqual({ value: [] })
    expect(response.reads()).toBe(0)
  })

  it('returns an empty page for Content-Length: 0, without touching the body', async () => {
    const response = fakeResponse('', { contentLength: '0' })
    expect(await parsePagedResponse(response)).toEqual({ value: [] })
    expect(response.reads()).toBe(0)
  })

  it('returns an empty page for a whitespace only body instead of throwing a SyntaxError', async () => {
    expect(await parsePagedResponse(fakeResponse('\n  \t '))).toEqual({ value: [] })
    expect(await parsePagedResponse(fakeResponse(''))).toEqual({ value: [] })
  })

  it('still parses a body when Content-Length is set to something other than zero', async () => {
    const body = JSON.stringify({ value: [{ id: 'a' }] })
    const response = fakeResponse(body, { contentLength: String(body.length) })
    expect(await parsePagedResponse(response)).toEqual({ value: [{ id: 'a' }] })
  })

  it('returns an empty page for a body without a value envelope', async () => {
    expect(await parsePagedResponse(fakeResponse(JSON.stringify({ id: 'a' })))).toEqual({
      value: [],
      nextLink: undefined
    })
  })
})

describe('collectPages', () => {
  it('returns a single page without asking for a second one', async () => {
    const { fetchPage, requested } = fakePages([{ value: ['a', 'b'] }])
    expect(await collectPages(fetchPage)).toEqual(['a', 'b'])
    expect(requested).toEqual([undefined])
  })

  it('follows nextLink and concatenates the pages in order', async () => {
    const { fetchPage, requested } = fakePages([
      { value: ['a'], nextLink: 'https://c/p2' },
      { value: ['b'], nextLink: 'https://c/p3' },
      { value: ['c'] }
    ])
    expect(await collectPages(fetchPage)).toEqual(['a', 'b', 'c'])
    expect(requested).toEqual([undefined, 'https://c/p2', 'https://c/p3'])
  })

  it('tolerates a page without a value array', async () => {
    const { fetchPage } = fakePages([
      { value: undefined, nextLink: 'https://c/p2' },
      { value: ['a'] }
    ])
    expect(await collectPages(fetchPage)).toEqual(['a'])
  })

  it('aborts when the server keeps handing back the same cursor', async () => {
    const fetchPage = (): Promise<IPagedResult<string>> =>
      Promise.resolve({ value: ['a'], nextLink: 'https://c/stuck' })
    await expect(collectPages(fetchPage)).rejects.toThrow(/repeated nextLink/)
  })

  it('aborts once the page limit is reached', async () => {
    let page = 0
    const fetchPage = (): Promise<IPagedResult<string>> => {
      page++
      return Promise.resolve({ value: ['a'], nextLink: `https://c/p${page}` })
    }
    await expect(collectPages(fetchPage, 3)).rejects.toThrow(/exceeded 3 pages/)
  })

  it('propagates a failing request instead of returning a partial result', async () => {
    const { fetchPage } = fakePages<string>([{ value: ['a'], nextLink: 'https://c/p2' }])
    await expect(collectPages(fetchPage)).rejects.toThrow(/more times than there are pages/)
  })

  it('stops at the limit and does not request the next page', async () => {
    const { fetchPage, requested } = fakePages([
      { value: ['a', 'b'], nextLink: 'https://c/p2' },
      { value: ['c'] }
    ])
    expect(await collectPages(fetchPage, 200, 2)).toEqual(['a', 'b'])
    expect(requested).toEqual([undefined])
  })

  it('truncates a page that overshoots the limit', async () => {
    const { fetchPage } = fakePages([{ value: ['a', 'b', 'c'], nextLink: 'https://c/p2' }])
    expect(await collectPages(fetchPage, 200, 2)).toEqual(['a', 'b'])
  })

  it('ignores a limit that is not a positive count', async () => {
    const { fetchPage } = fakePages([{ value: ['a'], nextLink: 'https://c/p2' }, { value: ['b'] }])
    expect(await collectPages(fetchPage, 200, undefined)).toEqual(['a', 'b'])
  })
})

describe('resolvePagedQuery', () => {
  it('always sets a $top, because the term store page size is otherwise the server default', () => {
    const target = fakeQuery()
    expect(resolvePagedQuery(fakeQuery(), target).values).toEqual({
      $top: String(DEFAULT_TERM_PAGE_SIZE)
    })
  })

  it('returns the target it was given, so the caller can chain', () => {
    const target = fakeQuery()
    expect(resolvePagedQuery(fakeQuery(), target)).toBe(target)
  })

  it('keeps a $top the caller set', () => {
    expect(resolvePagedQuery(fakeQuery({ $top: '10' }), fakeQuery()).values.$top).toBe('10')
  })

  it('carries the select that makes localProperties come back', () => {
    expect(
      resolvePagedQuery(fakeQuery({ $select: '*,localProperties' }), fakeQuery()).values
    ).toEqual({
      $select: '*,localProperties',
      $top: String(DEFAULT_TERM_PAGE_SIZE)
    })
  })

  it('carries filter, orderby and expand', () => {
    const resolved = resolvePagedQuery(
      fakeQuery({ $filter: 'isDeprecated eq false', $orderby: 'id', $expand: 'set' }),
      fakeQuery()
    ).values
    expect(resolved.$filter).toBe('isDeprecated eq false')
    expect(resolved.$orderby).toBe('id')
    expect(resolved.$expand).toBe('set')
  })

  it('throws on $skip rather than silently enumerating from offset 0', () => {
    expect(() => resolvePagedQuery(fakeQuery({ $skip: '10' }), fakeQuery())).toThrow(
      /does not support '\$skip'/
    )
  })

  it('ignores an empty $skip, which is what an untouched collection reports', () => {
    expect(() => resolvePagedQuery(fakeQuery({ $skip: '' }), fakeQuery())).not.toThrow()
  })

  it('uses the requested page size', () => {
    expect(resolvePagedQuery(fakeQuery(), fakeQuery(), 50).values.$top).toBe('50')
  })

  it('works against a real URLSearchParams, which is what Queryable.query is', () => {
    const source = new URLSearchParams()
    source.set('$select', '*,localProperties')
    const target = resolvePagedQuery(source, new URLSearchParams())
    expect(target.toString()).toBe(`%24select=*%2ClocalProperties&%24top=${DEFAULT_TERM_PAGE_SIZE}`)
  })
})

describe('readResultLimit', () => {
  it('reads a $top the caller set as a result count', () => {
    expect(readResultLimit(fakeQuery({ $top: '50' }))).toBe(50)
  })

  it('returns undefined when the caller set no $top', () => {
    expect(readResultLimit(fakeQuery())).toBeUndefined()
    expect(readResultLimit(fakeQuery({ $top: '' }))).toBeUndefined()
    expect(readResultLimit(undefined)).toBeUndefined()
  })

  it('returns undefined for a $top that is not a positive count', () => {
    expect(readResultLimit(fakeQuery({ $top: '0' }))).toBeUndefined()
    expect(readResultLimit(fakeQuery({ $top: '-5' }))).toBeUndefined()
    expect(readResultLimit(fakeQuery({ $top: 'all' }))).toBeUndefined()
  })
})
