// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The page operations reach SharePoint: one template is offered,
// and nothing is made here. The form and the dialog's own hooks are the real ones.
jest.mock('../util', () => ({
  getTemplates: jest.fn(() =>
    Promise.resolve([
      { Name: 'Nyhet.aspx', Title: 'Nyhet', ServerRelativeUrl: '/sites/alfa/SitePages/Nyhet.aspx' }
    ])
  ),
  ensureProjectNewsFolder: jest.fn(),
  getNewsPageName: jest.fn(),
  getServerRelativeUrl: jest.fn(),
  copyTemplatePage: jest.fn(),
  getNewsEditUrl: jest.fn(),
  setOriginalSourceSiteId: jest.fn(),
  getSitePageItemId: jest.fn(),
  doesSitePageExist: jest.fn(),
  recycleSitePage: jest.fn(),
  validateSharePointFileName: jest.fn(() => true)
}))

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { ProjectNewsContext } from '../context'
import { NewsDialog } from './NewsDialog'

/** The dialog open on a project site, as «Opprett nyhetsartikkel» opens it. */
async function renderOpenDialog() {
  render(
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
          state: { isDialogOpen: true, isDrawerOpen: false },
          setState: jest.fn()
        } as any
      }
    >
      <NewsDialog />
    </ProjectNewsContext.Provider>
  )
  // The templates arrive after the dialog opens.
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
}

const createButton = () => screen.getByText(strings.CreateButtonLabel).closest('button')
const templateField = () => screen.getByText(strings.TemplatePlaceholder).closest('button')

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

/**
 * «Ny nyhet»: «Opprett» waits for a title and a template, reachable by the keyboard and saying
 * what it waits for (WCAG 2.1.1, 3.3.2). It was `disabled`, skipped by Tab and silent. The
 * template field says it is required only once it has been left without one (WCAG 3.3.1): it said
 * so from the moment the dialog opened.
 */
describe('NewsDialog', () => {
  it('keeps «Opprett» focusable while it waits, and says it waits for a title and a template', async () => {
    await renderOpenDialog()
    expect(createButton()).toHaveAttribute('aria-disabled', 'true')
    expect(createButton()).not.toHaveAttribute('disabled')
    expect(createButton()).toHaveAccessibleDescription(strings.CreateButtonNeedsTitleAndTemplate)
  })

  it('says what is left once the title is given', async () => {
    await renderOpenDialog()
    fireEvent.change(screen.getByPlaceholderText(strings.NewsTitlePlaceholder), {
      target: { value: 'Ny bane' }
    })
    expect(createButton()).toHaveAccessibleDescription(strings.CreateButtonNeedsTemplate)
  })

  it('shows no error on the template before the field has been left without one', async () => {
    await renderOpenDialog()
    expect(screen.queryByText(strings.TemplateRequired)).toBeNull()
    act(() => {
      fireEvent.blur(templateField())
    })
    expect(screen.getByText(strings.TemplateRequired)).toBeInTheDocument()
  })
})
