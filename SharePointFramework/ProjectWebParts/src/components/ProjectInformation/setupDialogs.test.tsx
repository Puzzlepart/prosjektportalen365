import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { ProjectInformationContextProvider } from './context'
import { CreateParentDialog } from './CreateParentDialog'
import { RunProjectSetupDialog } from './RunProjectSetupDialog'
import { NAVIGATION_NODES_STORAGE_KEY } from './saveNavigationNodes'

const PROJECT = 'https://contoso.sharepoint.com/sites/frisbee'
const NODES = [{ Title: 'Banekart', SimpleUrl: 'https://kart.contoso.no/frisbee', Nodes: [] }]

/**
 * The dialog open on the project site. `added` records the setup's custom action as it is added,
 * with what local storage held for the menu at that moment.
 */
function renderDialog(Dialog: React.FC, activeDialog: string) {
  const added: Array<{ action: Record<string, any>; saved: string }> = []
  const sp = {
    navigation: { getMenuState: () => Promise.resolve({ Nodes: NODES }) },
    web: {
      userCustomActions: {
        add: (action: Record<string, any>) => {
          added.push({ action, saved: localStorage.getItem(NAVIGATION_NODES_STORAGE_KEY) })
          return Promise.resolve()
        }
      }
    }
  }
  render(
    <ProjectInformationContextProvider
      value={
        {
          props: { sp, pageContext: { web: { language: 1044, absoluteUrl: PROJECT } } },
          state: { activeDialog },
          dispatch: jest.fn()
        } as any
      }
    >
      <Dialog />
    </ProjectInformationContextProvider>
  )
  return added
}

let consoleError: jest.SpyInstance

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  // jsdom cannot navigate; the dialogs reload the page to start the setup.
  // eslint-disable-next-line no-console
  const original = console.error
  consoleError = jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
    if (String(args[0]?.message ?? args[0]).includes('Not implemented: navigation')) return
    original(...args)
  })
})

afterEach(() => consoleError.mockRestore())

describe('The dialogs that run the setup on a set-up project', () => {
  it('«Gjør om til overordnet prosjekt» saves the menu for the site before it starts the setup', async () => {
    const added = renderDialog(CreateParentDialog, 'CreateParentDialog')
    fireEvent.click(screen.getByRole('button', { name: strings.RedoText }))
    await waitFor(() => expect(added).toHaveLength(1))
    expect(JSON.parse(added[0].saved)).toEqual({ webUrl: PROJECT, nodes: NODES })
    expect(JSON.parse(added[0].action.ClientSideComponentProperties).forceTemplate).toBeTruthy()
  })

  it('«Kjør oppsettveiviser» saves the menu for the site, and lets the user pick the template', async () => {
    const added = renderDialog(RunProjectSetupDialog, 'RunProjectSetupDialog')
    fireEvent.click(screen.getByRole('button', { name: strings.ConfirmText }))
    await waitFor(() => expect(added).toHaveLength(1))
    expect(JSON.parse(added[0].saved)).toEqual({ webUrl: PROJECT, nodes: NODES })
    expect(JSON.parse(added[0].action.ClientSideComponentProperties).forceTemplate).toBe(
      '__SELECT_TEMPLATE__'
    )
    expect(sessionStorage.getItem('pp_skipAlreadySetupCheck')).toBe('true')
  })
})
