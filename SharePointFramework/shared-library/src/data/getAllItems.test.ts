import { DEFAULT_PAGE_SIZE, getAllItems } from './getAllItems'

/**
 * Stand-in for a PnPjs `IItems` query: records the `$top` it was given and yields the
 * configured pages through the async iterator PnPjs 4 exposes on collections. Structural on
 * purpose so the test runs without the ESM-only `@pnp/*` runtime.
 */
function fakeItems(pages: any[][]) {
  const calls: number[] = []
  const query = {
    calls,
    top(size: number) {
      calls.push(size)
      return query
    },
    async *[Symbol.asyncIterator]() {
      for (const page of pages) yield page
    }
  }
  return query
}

describe('getAllItems', () => {
  it('concatenates every page into one array', async () => {
    const items = fakeItems([[{ Id: 1 }, { Id: 2 }], [{ Id: 3 }]])
    await expect(getAllItems(items as any)).resolves.toEqual([{ Id: 1 }, { Id: 2 }, { Id: 3 }])
  })

  it('returns an empty array for an empty list', async () => {
    await expect(getAllItems(fakeItems([]) as any)).resolves.toEqual([])
  })

  it('always sends an explicit $top, defaulting to the size v3 getAll used', async () => {
    const items = fakeItems([[]])
    await getAllItems(items as any)
    expect(items.calls).toEqual([DEFAULT_PAGE_SIZE])
    expect(DEFAULT_PAGE_SIZE).toBe(2000)
  })

  it('honours a caller supplied page size', async () => {
    const items = fakeItems([[]])
    await getAllItems(items as any, 500)
    expect(items.calls).toEqual([500])
  })
})
