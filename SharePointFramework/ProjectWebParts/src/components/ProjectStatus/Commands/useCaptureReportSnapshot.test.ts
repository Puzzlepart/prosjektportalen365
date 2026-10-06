// dom-to-image draws on a canvas, which jsdom lacks; it is a stand-in, registered before the
// imports because Heft runs Jest on CommonJS output without Babel (mocks are not hoisted).
const mockToBlob = jest.fn()
jest.mock('dom-to-image', () => ({ __esModule: true, default: { toBlob: mockToBlob } }))

import { getSnapshotScale, useCaptureReportSnapshot } from './useCaptureReportSnapshot'

/**
 * Capturing the published report: the project title above it and the capture date below it,
 * on the page only while the snapshot is taken; twice the page's resolution, less for reports
 * too long for a browser's canvas, and the page's resolution when the larger canvas fails.
 */
describe('useCaptureReportSnapshot', () => {
  const png = new Blob(['png'], { type: 'image/png' })

  function statusSection(innerHTML = '', width = 1200, height = 3000) {
    document.body.innerHTML = `<div id="pp-statussection">${innerHTML}</div>`
    const node = document.getElementById('pp-statussection')
    Object.defineProperty(node, 'scrollWidth', { value: width })
    Object.defineProperty(node, 'scrollHeight', { value: height })
    return node
  }

  /** The status section as dom-to-image is given it, for the additions only present then. */
  function captureHtml(): Promise<string> {
    return new Promise((resolve) =>
      mockToBlob.mockImplementation((node: HTMLElement) => {
        resolve(node.outerHTML)
        return Promise.resolve(png)
      })
    )
  }

  beforeEach(() => mockToBlob.mockReset())

  it('scales by two, less for a report longer than a canvas can be, and never below one', () => {
    expect(getSnapshotScale(1200, 3000)).toBe(2)
    expect(getSnapshotScale(1200, 12000)).toBeCloseTo(16384 / 12000)
    expect(getSnapshotScale(1200, 40000)).toBe(1)
    expect(getSnapshotScale(0, 0)).toBe(2)
  })

  it('captures the report at twice its size, keeping its layout', async () => {
    const node = statusSection()
    mockToBlob.mockResolvedValue(png)
    await expect(useCaptureReportSnapshot()()).resolves.toBe(png)
    expect(mockToBlob).toHaveBeenCalledTimes(1)
    expect(mockToBlob).toHaveBeenCalledWith(node, {
      width: 2400,
      height: 6000,
      style: {
        transform: 'scale(2)',
        transformOrigin: 'top left',
        width: '1200px',
        height: '3000px'
      }
    })
  })

  it("falls back to the page's resolution when the larger canvas fails", async () => {
    const node = statusSection()
    mockToBlob.mockRejectedValueOnce(new Error('canvas too large')).mockResolvedValueOnce(png)
    await expect(useCaptureReportSnapshot()()).resolves.toBe(png)
    expect(mockToBlob).toHaveBeenLastCalledWith(node)
  })

  it('puts the project title above the project information and the date below the report', async () => {
    const node = statusSection(
      '<div data-snapshot-title-anchor=""><p>Prosjektinformasjon</p></div>'
    )
    const captured = captureHtml()
    await useCaptureReportSnapshot()('Frisbeegolfbane – Delprosjekt A')
    const snapshot = document.createElement('div')
    snapshot.innerHTML = await captured
    const anchor = snapshot.querySelector('[data-snapshot-title-anchor]')
    expect(anchor.firstElementChild.tagName).toBe('H2')
    expect(anchor.firstElementChild.textContent).toBe('Frisbeegolfbane – Delprosjekt A')
    expect(snapshot.firstElementChild.lastElementChild.textContent).toMatch(
      /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/
    )
    // Only the snapshot has them: the page is as it was.
    expect(node.querySelector('h2')).toBeNull()
    expect(node.lastElementChild).toBe(node.querySelector('[data-snapshot-title-anchor]'))
    expect(node.style.backgroundColor).toBe('')
  })

  it('puts the project title at the top of a report without project information', async () => {
    statusSection('<p>Status</p>')
    const captured = captureHtml()
    await useCaptureReportSnapshot()('Frisbeegolfbane')
    const snapshot = document.createElement('div')
    snapshot.innerHTML = await captured
    expect(snapshot.firstElementChild.firstElementChild.outerHTML).toMatch(
      /^<h2[^>]*>Frisbeegolfbane<\/h2>$/
    )
  })
})
