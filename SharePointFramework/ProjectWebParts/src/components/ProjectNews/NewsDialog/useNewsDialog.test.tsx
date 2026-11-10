// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The page operations reach SharePoint and are stand-ins that
// succeed unless a test says otherwise (the page's item is 7, and its name is valid); the form is
// a stand-in that holds a valid title and template, and records the error it is given.
jest.mock('../util', () => ({
  ensureProjectNewsFolder: jest.fn(() => Promise.resolve()),
  getTemplates: jest.fn(() => Promise.resolve([])),
  getNewsPageName: jest.fn(() => 'Ny-bane.aspx'),
  getServerRelativeUrl: jest.fn(() => '/sites/alfa/SitePages/Nyheter/Ny-bane.aspx'),
  copyTemplatePage: jest.fn(() => Promise.resolve({ ok: true })),
  getNewsEditUrl: jest.fn(() => '/sites/alfa/SitePages/Nyheter/Ny-bane.aspx?Mode=Edit'),
  setOriginalSourceSiteId: jest.fn(() => Promise.resolve()),
  getSitePageItemId: jest.fn(() =>
    Promise.resolve({ itemId: 7, sitePagesServerRelativeUrl: '/sites/alfa/SitePages' })
  ),
  doesSitePageExist: jest.fn(() => Promise.resolve(false)),
  recycleSitePage: jest.fn(() => Promise.resolve()),
  validateSharePointFileName: jest.fn(() => true)
}))
const form = { setFormErrorMessage: jest.fn(), resetForm: jest.fn() }
jest.mock('./useNewsForm', () => ({
  useNewsForm: () => ({
    title: 'Ny bane',
    selectedTemplate: '/sites/alfa/SitePages/Maler/Nyhet.aspx',
    isFormValid: true,
    validateForm: () => true,
    setFormErrorMessage: form.setFormErrorMessage,
    resetForm: form.resetForm
  })
}))

import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { act, render, waitFor } from '@testing-library/react'
import { format } from 'pp365-shared-library'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { ProjectNewsContext } from '../context'
import {
  copyTemplatePage,
  ensureProjectNewsFolder,
  getSitePageItemId,
  recycleSitePage,
  setOriginalSourceSiteId,
  validateSharePointFileName
} from '../util'
import { useNewsDialog } from './useNewsDialog'
import { announced } from 'pp365-jest-config/lib/announce'

const SITE = 'https://contoso.sharepoint.com/sites/alfa'
const PAGE = '/sites/alfa/SitePages/Nyheter/Ny-bane.aspx'

/** Renders the dialog's hook; `dialog.current` is what it returned last. */
function renderDialog() {
  const dialog: { current?: ReturnType<typeof useNewsDialog> } = {}
  const Probe: React.FC = () => {
    dialog.current = useNewsDialog()
    return null
  }
  render(
    <AriaLiveAnnouncer>
      <ProjectNewsContext.Provider
        value={
          {
            props: {
              siteUrl: SITE,
              spHttpClient: {},
              newsFolderName: 'Nyheter',
              context: { pageContext: { site: { id: 'site-1' } } },
              pageContext: { legacyPageContext: { hubSiteId: 'hub-1' } }
            },
            state: { isDialogOpen: false },
            setState: jest.fn()
          } as any
        }
      >
        <Probe />
      </ProjectNewsContext.Provider>
    </AriaLiveAnnouncer>
  )
  return dialog
}

/** Creates the article, as the dialog's create button does. */
const create = (dialog: ReturnType<typeof renderDialog>) =>
  act(() => dialog.current.handleCreate({ preventDefault: () => undefined } as any))

describe('useNewsDialog', () => {
  beforeEach(() => jest.clearAllMocks())

  it('tells a screen reader that the news is being made, and that it is made (WCAG 4.1.3)', async () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null)
    try {
      const dialog = renderDialog()
      await act(async () => {
        const creating = dialog.current.handleCreate({ preventDefault: () => undefined } as any)
        // Read while the page is made: the announcer replaces it with the next message.
        await new Promise((resolve) => setTimeout(resolve, 50))
        expect(announced()).toContain(strings.CreatingNewArticleStatus)
        await creating
      })
      // Waits for what is asserted, not a fixed time: in a full build the projects' tests run side
      // by side, and the announcer and the dialog's timers took longer than 50 ms.
      await waitFor(() => expect(announced()).toContain(strings.NewsCreatedSuccessfully), {
        timeout: 5000
      })
      // The page is tied to its project, and named, with the dialog's title.
      expect(setOriginalSourceSiteId).toHaveBeenCalledWith(
        SITE,
        {},
        '/sites/alfa/SitePages',
        7,
        'site-1',
        'hub-1',
        'Ny bane'
      )
      // The dialog closes and the new page opens for editing, as before.
      await waitFor(
        () =>
          expect(open).toHaveBeenCalledWith(
            '/sites/alfa/SitePages/Nyheter/Ny-bane.aspx?Mode=Edit',
            '_blank'
          ),
        { timeout: 5000 }
      )
    } finally {
      open.mockRestore()
    }
  })

  describe('when the article cannot be made', () => {
    // The hook logs the error it shows; here that is only noise in the output.
    let consoleError: jest.SpyInstance
    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })
    afterEach(() => consoleError.mockRestore())

    it('removes the copied page when it cannot be tied to the project, and shows why', async () => {
      // A hub whose page library has a Gt field the project list lacks failed here, and left a
      // draft with the template's title behind.
      const open = jest.spyOn(window, 'open').mockImplementation(() => null)
      try {
        ;(setOriginalSourceSiteId as jest.Mock).mockRejectedValueOnce(
          new Error('Feltet eller egenskapen GtHubUrl finnes ikke.')
        )
        const dialog = renderDialog()
        await create(dialog)
        expect(recycleSitePage).toHaveBeenCalledWith(SITE, {}, PAGE)
        expect(form.setFormErrorMessage).toHaveBeenLastCalledWith(
          `${strings.NewsCreateError} Feltet eller egenskapen GtHubUrl finnes ikke.`
        )
        expect(dialog.current.spinnerMode).toBe('idle')
        // Longer than the 1100 ms after which a made article opens: nothing opens.
        await act(() => new Promise((resolve) => setTimeout(resolve, 1200)))
        expect(open).not.toHaveBeenCalled()
      } finally {
        open.mockRestore()
      }
    })

    it('names the page it left behind when the page could not be removed either', async () => {
      ;(setOriginalSourceSiteId as jest.Mock).mockRejectedValueOnce(new Error('Tilgang nektet'))
      ;(recycleSitePage as jest.Mock).mockRejectedValueOnce(new Error('Forbidden'))
      const dialog = renderDialog()
      await create(dialog)
      expect(form.setFormErrorMessage).toHaveBeenLastCalledWith(
        `${strings.NewsCreateError} Tilgang nektet ${format(
          strings.NewsCreateLeftoverPageError,
          'Ny-bane.aspx',
          'Nyheter'
        )}`
      )
      expect(dialog.current.spinnerMode).toBe('idle')
    })

    it('shows why the template could not be copied, and gives the form back', async () => {
      // The spinner stayed, and hid the error, when the copy itself failed.
      ;(copyTemplatePage as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            'odata.error': { message: { lang: 'nb-NO', value: 'Filen finnes ikke.' } }
          })
      })
      const dialog = renderDialog()
      await create(dialog)
      expect(form.setFormErrorMessage).toHaveBeenLastCalledWith(
        `${strings.NewsCreateError} Filen finnes ikke.`
      )
      expect(dialog.current.spinnerMode).toBe('idle')
      expect(getSitePageItemId).not.toHaveBeenCalled()
      expect(recycleSitePage).not.toHaveBeenCalled()
    })

    it("removes the copied page when the page's item cannot be found, and shows why", async () => {
      // The page was opened for editing without its project link, so the project's news never
      // listed it.
      const open = jest.spyOn(window, 'open').mockImplementation(() => null)
      const notFound = format(strings.NewsPageItemNotFoundError, 'Ny-bane.aspx')
      ;(getSitePageItemId as jest.Mock).mockRejectedValueOnce(new Error(notFound))
      const dialog = renderDialog()
      await create(dialog)
      expect(getSitePageItemId).toHaveBeenCalledWith(SITE, {}, PAGE)
      expect(setOriginalSourceSiteId).not.toHaveBeenCalled()
      expect(recycleSitePage).toHaveBeenCalledWith(SITE, {}, PAGE)
      expect(form.setFormErrorMessage).toHaveBeenLastCalledWith(
        `${strings.NewsCreateError} ${notFound}`
      )
      expect(dialog.current.spinnerMode).toBe('idle')
      await act(() => new Promise((resolve) => setTimeout(resolve, 1200)))
      expect(open).not.toHaveBeenCalled()
      open.mockRestore()
    })
  })

  it('refuses a title that leaves no valid page name, before anything is made', async () => {
    // A title of nothing but characters a file name cannot have was sent to SharePoint as is.
    ;(validateSharePointFileName as jest.Mock).mockReturnValueOnce(strings.FileNameRequired)
    const dialog = renderDialog()
    await create(dialog)
    expect(form.setFormErrorMessage).toHaveBeenLastCalledWith(strings.FileNameRequired)
    expect(ensureProjectNewsFolder).not.toHaveBeenCalled()
    expect(copyTemplatePage).not.toHaveBeenCalled()
    expect(dialog.current.spinnerMode).toBe('idle')
  })
})
