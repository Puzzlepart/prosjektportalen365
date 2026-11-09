// util pulls the data adapter in for the page operations; it is not under test here, so it is a
// stand-in, registered before the imports because Heft runs Jest on CommonJS output without Babel.
jest.mock('data', () => ({ __esModule: true, default: {} }))

import strings from 'ProjectWebPartsStrings'
import { isUnauthorizedError } from 'pp365-shared-library'
import {
  ensureProjectNewsFolder,
  getNewsEditUrl,
  getNewsPageName,
  getServerRelativeUrl,
  isNewsAccessDenied,
  newsNoAccessError,
  validateSharePointFileName
} from './util'

/**
 * The news helpers: the page name a title becomes, the URLs a page lives at, and SharePoint's
 * rules for a file name.
 */
describe('ProjectNews util', () => {
  it('turns a title into a page name and an edit URL', () => {
    expect(getNewsPageName('Ny bane  åpnet')).toBe('Ny-bane-åpnet.aspx')
    expect(
      getNewsEditUrl('https://contoso.sharepoint.com/sites/alfa', 'Prosjektnyheter', 'Ny-bane.aspx')
    ).toBe(
      'https://contoso.sharepoint.com/sites/alfa/SitePages/Prosjektnyheter/Ny-bane.aspx?Mode=Edit'
    )
  })

  it('builds server-relative URLs without doubled slashes', () => {
    expect(
      getServerRelativeUrl('https://contoso.sharepoint.com/sites/alfa/', 'SitePages', 'Nyheter')
    ).toBe('/sites/alfa/SitePages/Nyheter')
  })

  it('tells a refused news site from other answers', () => {
    expect(isNewsAccessDenied({ status: 403 } as any)).toBe(true)
    expect(isNewsAccessDenied({ status: 401 } as any)).toBe(true)
    expect(isNewsAccessDenied({ status: 404 } as any)).toBe(false)
    const error = newsNoAccessError()
    expect(error.message).toBe(strings.NewsNoAccessErrorText)
    expect(isUnauthorizedError(error)).toBe(true)
  })

  it('says access is missing when the news site refuses the folder', async () => {
    const spHttpClient = { get: jest.fn(() => Promise.resolve({ ok: false, status: 403 })) }
    await expect(
      ensureProjectNewsFolder(
        'https://contoso.sharepoint.com/sites/portefolje',
        spHttpClient as any,
        'Prosjektnyheter'
      )
    ).rejects.toThrow(strings.NewsNoAccessErrorText)
  })

  it('validates a file name the way SharePoint does', () => {
    expect(validateSharePointFileName('Ny bane')).toBe(true)
    expect(validateSharePointFileName('')).toBe(strings.FileNameRequired)
    expect(validateSharePointFileName('x'.repeat(101))).toBe(strings.FileNameTooLong)
    expect(validateSharePointFileName('a/b')).toBe(strings.FileNameInvalid)
    expect(validateSharePointFileName('.skjult')).toBe(strings.FileNameNoLeadingTrailingSpaces)
    expect(validateSharePointFileName('CON')).toBe(strings.FileNameReserved)
  })
})
