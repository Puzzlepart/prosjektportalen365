// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The catalog service fetches from the catalog's host; here it
// answers as each test sets it.
const mockCatalogService = {
  getChangelog: jest.fn(),
  getPackageContents: jest.fn(),
  getFileText: jest.fn()
}
jest.mock('services', () => ({ CatalogService: mockCatalogService }))

import { act, renderHook, waitFor } from '@testing-library/react'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import { usePackageContentSummary } from './usePackageContentSummary'
import { usePackageFilePreview } from './usePackageFilePreview'
import { usePackageHistory } from './usePackageHistory'

/**
 * What the package details load of a package: its history, its contents and a file of it. Each
 * shows what it loaded, or that the load failed with a way to try again, and a failure that is
 * shown is counted once for usage statistics, for the command set, by the error's code.
 */
const ALIAS = 'TemplatePackageCatalog'
const CHANGELOG = 'https://katalog.example/packages/bygg/CHANGELOG.md'
const FILE = 'https://katalog.example/packages/bygg/content/fasesjekkliste.json'
const PACKAGE = { id: 'Byggprosjekt', name: 'Byggprosjekt', version: '2.0.0' } as any

/** An error as a fetch function gives it for a response with this status. */
const failure = (status: number) => Object.assign(new Error(`Svarte ${status}`), { status })

/** Under the command set's alias, as the command set renders the catalog. */
const wrapper = ({ children }: React.PropsWithChildren) =>
  React.createElement(TelemetryProvider, { component: ALIAS }, children)

/** A load that the test answers when it chooses to. */
function pending<T>() {
  const answer = {} as { resolve: (value: T) => void; reject: (error: unknown) => void }
  // The executor runs at once, so both are set before they are handed out.
  const promise = new Promise<T>((resolve, reject) => {
    Object.assign(answer, { resolve, reject })
  })
  return { promise, ...answer }
}

beforeEach(() => {
  jest.clearAllMocks()
  startTestTelemetry()
})

describe('usePackageHistory', () => {
  it('loads the history of a package that has a changelog, and none without one', async () => {
    const entries = [{ version: '2.0.0', changes: ['Ny fasesjekkliste'] }]
    mockCatalogService.getChangelog.mockResolvedValue(entries)
    const { result, rerender } = renderHook(({ url }) => usePackageHistory(url), {
      wrapper,
      initialProps: { url: CHANGELOG as string | undefined }
    })
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.entries).toEqual(entries))
    expect(result.current).toMatchObject({ loading: false, error: false })
    rerender({ url: undefined })
    expect(result.current).toMatchObject({ entries: [], error: false })
    expect(mockCatalogService.getChangelog).toHaveBeenCalledTimes(1)
    expect(countedTelemetry().errors).toEqual({})
  })

  it('tells and counts a history that could not be loaded, and loads it again on retry', async () => {
    mockCatalogService.getChangelog.mockRejectedValue(failure(503))
    const { result } = renderHook(() => usePackageHistory(CHANGELOG), { wrapper })
    await waitFor(() => expect(result.current.error).toBe(true))
    expect(result.current.loading).toBe(false)
    expect(countedTelemetry().errors).toEqual({ [`${ALIAS} server_error 503`]: 1 })
    mockCatalogService.getChangelog.mockResolvedValue([])
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.error).toBe(false))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(countedTelemetry().errors).toEqual({ [`${ALIAS} server_error 503`]: 1 })
  })

  it.each([
    ['an answer', (load: ReturnType<typeof pending>) => load.resolve([{ version: '1.0.0' }])],
    ['a failure', (load: ReturnType<typeof pending>) => load.reject(failure(500))]
  ])('drops %s that arrives after the details were closed', async (_, settle) => {
    const load = pending()
    mockCatalogService.getChangelog.mockReturnValue(load.promise)
    const { result, unmount } = renderHook(() => usePackageHistory(CHANGELOG), { wrapper })
    unmount()
    await act(async () => {
      settle(load)
      await load.promise.catch(() => undefined)
    })
    expect(result.current).toMatchObject({ entries: [], error: false })
    expect(countedTelemetry().errors).toEqual({})
  })
})

describe('usePackageContentSummary', () => {
  it('loads the contents of the package, and shows its details and a file of it when asked', async () => {
    const contents = { summary: [], hierarchy: [] }
    mockCatalogService.getPackageContents.mockResolvedValue(contents)
    const { result } = renderHook(() => usePackageContentSummary(PACKAGE), { wrapper })
    await waitFor(() => expect(result.current.contents).toBe(contents))
    expect(result.current).toMatchObject({ loading: false, error: false, showDetails: false })
    act(() => result.current.toggleDetails())
    expect(result.current.showDetails).toBe(true)
    act(() => result.current.openPreview({ title: 'Fasesjekkliste', url: FILE }))
    expect(result.current.preview).toEqual({ title: 'Fasesjekkliste', url: FILE })
    act(() => result.current.closePreview())
    expect(result.current.preview).toEqual({})
    expect(countedTelemetry().errors).toEqual({})
  })

  it('tells and counts contents that could not be loaded, and loads them again on retry', async () => {
    mockCatalogService.getPackageContents.mockRejectedValue(failure(404))
    const { result } = renderHook(() => usePackageContentSummary(PACKAGE), { wrapper })
    await waitFor(() => expect(result.current.error).toBe(true))
    expect(countedTelemetry().errors).toEqual({ [`${ALIAS} not_found 404`]: 1 })
    mockCatalogService.getPackageContents.mockResolvedValue(undefined)
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(false)
    expect(mockCatalogService.getPackageContents).toHaveBeenCalledTimes(2)
    expect(countedTelemetry().errors).toEqual({ [`${ALIAS} not_found 404`]: 1 })
  })

  it.each([
    ['an answer', (load: ReturnType<typeof pending>) => load.resolve({ summary: [] })],
    ['a failure', (load: ReturnType<typeof pending>) => load.reject(failure(500))]
  ])('drops %s for a package the details have left', async (_, settle) => {
    const load = pending()
    mockCatalogService.getPackageContents.mockReturnValue(load.promise)
    const { result, unmount } = renderHook(() => usePackageContentSummary(PACKAGE), { wrapper })
    unmount()
    await act(async () => {
      settle(load)
      await load.promise.catch(() => undefined)
    })
    expect(result.current).toMatchObject({ contents: undefined, error: false })
    expect(countedTelemetry().errors).toEqual({})
  })
})

describe('usePackageFilePreview', () => {
  const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

  afterEach(() => {
    delete (navigator as any).clipboard
    if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard)
  })

  it('loads nothing until a file is chosen, then shows it, JSON laid out', async () => {
    mockCatalogService.getFileText.mockResolvedValue('{"Title":"Fasesjekkliste"}')
    const { result, rerender } = renderHook(({ url }) => usePackageFilePreview(url), {
      wrapper,
      initialProps: { url: undefined as string | undefined }
    })
    expect(result.current).toMatchObject({ content: undefined, loading: false, error: false })
    expect(mockCatalogService.getFileText).not.toHaveBeenCalled()
    // Nothing to copy yet.
    act(() => result.current.copy())
    expect(result.current.copied).toBe(false)
    rerender({ url: FILE })
    await waitFor(() =>
      expect(result.current.content).toEqual({
        value: '{\n  "Title": "Fasesjekkliste"\n}',
        isJson: true
      })
    )
    mockCatalogService.getFileText.mockResolvedValue('Les meg')
    rerender({ url: `${FILE}.txt` })
    await waitFor(() => expect(result.current.content).toEqual({ value: 'Les meg', isJson: false }))
    expect(countedTelemetry().errors).toEqual({})
  })

  it('copies the file to the clipboard, and says so for a moment', async () => {
    const writeText = jest.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    mockCatalogService.getFileText.mockResolvedValue('Les meg')
    const { result } = renderHook(() => usePackageFilePreview(FILE), { wrapper })
    await waitFor(() => expect(result.current.content).toBeDefined())
    act(() => result.current.copy())
    expect(writeText).toHaveBeenCalledWith('Les meg')
    await waitFor(() => expect(result.current.copied).toBe(true))
    await waitFor(() => expect(result.current.copied).toBe(false), { timeout: 4000 })
  })

  it('tells and counts a file that could not be loaded', async () => {
    mockCatalogService.getFileText.mockRejectedValue(failure(429))
    const { result } = renderHook(() => usePackageFilePreview(FILE), { wrapper })
    await waitFor(() => expect(result.current.error).toBe(true))
    expect(result.current).toMatchObject({ content: undefined, loading: false })
    expect(countedTelemetry().errors).toEqual({ [`${ALIAS} throttled 429`]: 1 })
  })

  it.each([
    ['an answer', (load: ReturnType<typeof pending>) => load.resolve('Les meg')],
    ['a failure', (load: ReturnType<typeof pending>) => load.reject(failure(500))]
  ])('drops %s for a file the preview has left', async (_, settle) => {
    const load = pending()
    mockCatalogService.getFileText.mockReturnValue(load.promise)
    const { result, unmount } = renderHook(() => usePackageFilePreview(FILE), { wrapper })
    unmount()
    await act(async () => {
      settle(load)
      await load.promise.catch(() => undefined)
    })
    expect(result.current).toMatchObject({ content: undefined, error: false })
    expect(countedTelemetry().errors).toEqual({})
  })
})
