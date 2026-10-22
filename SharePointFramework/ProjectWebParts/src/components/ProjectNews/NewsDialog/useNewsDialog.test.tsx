// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The page operations reach SharePoint and are stand-ins that
// succeed; the form is a stand-in that holds a valid title and template.
jest.mock('../util', () => ({
  ensureProjectNewsFolder: jest.fn(() => Promise.resolve()),
  getTemplates: jest.fn(() => Promise.resolve([])),
  getNewsPageName: jest.fn(() => 'Ny-bane.aspx'),
  getServerRelativeUrl: jest.fn(() => '/sites/alfa/SitePages/Nyheter/Ny-bane.aspx'),
  copyTemplatePage: jest.fn(() => Promise.resolve({ ok: true })),
  getNewsEditUrl: jest.fn(() => '/sites/alfa/SitePages/Nyheter/Ny-bane.aspx?Mode=Edit'),
  setOriginalSourceSiteId: jest.fn(() => Promise.resolve()),
  getSitePageItemIdByFileName: jest.fn(() => Promise.resolve({ itemId: null })),
  doesSitePageExist: jest.fn(() => Promise.resolve(false))
}))
jest.mock('./useNewsForm', () => ({
  useNewsForm: () => ({
    title: 'Ny bane',
    selectedTemplate: '/sites/alfa/SitePages/Maler/Nyhet.aspx',
    isFormValid: true,
    validateForm: () => true,
    setFormErrorMessage: jest.fn(),
    resetForm: jest.fn()
  })
}))

import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { act, render } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { ProjectNewsContext } from '../context'
import { useNewsDialog } from './useNewsDialog'
import { announced } from 'pp365-jest-config/lib/announce'

describe('useNewsDialog', () => {
  it('tells a screen reader that the news is being made, and that it is made (WCAG 4.1.3)', async () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null)
    const dialog: { handleCreate?: (event: any) => Promise<void> } = {}
    const Probe: React.FC = () => {
      dialog.handleCreate = useNewsDialog().handleCreate
      return null
    }
    render(
      <AriaLiveAnnouncer>
        <ProjectNewsContext.Provider
          value={
            {
              props: {
                siteUrl: 'https://contoso.sharepoint.com/sites/alfa',
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
    await act(() => dialog.handleCreate({ preventDefault: () => undefined }))
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
    expect(announced()).toContain(strings.CreatingNewArticleStatus)
    expect(announced()).toContain(strings.NewsCreatedSuccessfully)
    // The dialog closes and the new page opens for editing, as before.
    await act(() => new Promise((resolve) => setTimeout(resolve, 1200)))
    expect(open).toHaveBeenCalledWith(
      '/sites/alfa/SitePages/Nyheter/Ny-bane.aspx?Mode=Edit',
      '_blank'
    )
    open.mockRestore()
  })
})
