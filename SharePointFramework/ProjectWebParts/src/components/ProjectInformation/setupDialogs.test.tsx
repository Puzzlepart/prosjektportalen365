// The dialogs log under the component's name; loading the component would load all of it.
jest.mock('./ProjectInformation', () => ({
  ProjectInformation: { displayName: 'Project Information' }
}))
jest.mock('pp365-shared-library/lib/logging', () => ({
  ListLogger: { log: jest.fn(() => Promise.resolve()) }
}))

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { format } from 'pp365-shared-library'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { ProjectInformationContextProvider } from './context'
import { CreateParentDialog } from './CreateParentDialog'
import { CLOSE_DIALOG } from './reducer'
import { RunProjectSetupDialog } from './RunProjectSetupDialog'
import { NAVIGATION_NODES_STORAGE_KEY } from './saveNavigationNodes'

const PROJECT = 'https://contoso.sharepoint.com/sites/frisbee'
const NODES = [{ Title: 'Banekart', SimpleUrl: 'https://kart.contoso.no/frisbee', Nodes: [] }]

/** How PnPjs rejects a request SharePoint refuses: SharePoint's own message in its JSON. */
const ACCESS_DENIED =
  'Error making HttpClient request in queryable [403] Forbidden ::> {"odata.error":{"code":"-2147024891, System.UnauthorizedAccessException","message":{"lang":"nb-NO","value":"Tilgang nektet."}}}'

type MenuState = { Nodes: any[] }

/**
 * The dialog open on the project site, reading the menu with `getMenuState`. `added` records the
 * setup's custom action as it is added, with what local storage held for the menu at that moment;
 * `add` is the call itself, to count the attempts or make one fail. `setActiveDialog` closes or
 * opens the dialog as the component's state would.
 */
function renderDialog(
  Dialog: React.FC,
  activeDialog: string,
  getMenuState: () => Promise<MenuState> = () => Promise.resolve({ Nodes: NODES }),
  language = 1044
) {
  const added: Array<{ action: Record<string, any>; saved: string }> = []
  const dispatch = jest.fn()
  const add = jest.fn((action: Record<string, any>) => {
    added.push({ action, saved: localStorage.getItem(NAVIGATION_NODES_STORAGE_KEY) })
    return Promise.resolve()
  })
  const sp = { navigation: { getMenuState }, web: { userCustomActions: { add } } }
  const tree = (active: string) => (
    <ProjectInformationContextProvider
      value={
        {
          props: { sp, pageContext: { web: { language, absoluteUrl: PROJECT } } },
          state: { activeDialog: active },
          dispatch
        } as any
      }
    >
      <Dialog />
    </ProjectInformationContextProvider>
  )
  const { rerender } = render(tree(activeDialog))
  return { add, added, dispatch, setActiveDialog: (active: string) => rerender(tree(active)) }
}

/** A menu read that the test answers when it chooses. */
function pendingMenu() {
  let answer: (menu: MenuState) => void
  const promise = new Promise<MenuState>((resolve) => (answer = resolve))
  const getMenuState = jest.fn(() => promise)
  return { getMenuState, answer: (menu: MenuState) => answer(menu) }
}

/** Lets the dialog's pending promises settle. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)))

let consoleError: jest.SpyInstance

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  // jsdom cannot navigate; the dialogs reload the page to start the setup. A failed menu read is
  // logged by saveNavigationNodes, as its own test checks.
  // eslint-disable-next-line no-console
  const original = console.error
  consoleError = jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
    const message = String(args[0]?.message ?? args[0])
    if (message.includes('Not implemented: navigation')) return
    if (message.includes('Failed to save navigation nodes')) return
    original(...args)
  })
})

afterEach(() => {
  consoleError.mockRestore()
  jest.clearAllMocks()
})

describe('The dialogs that run the setup on a set-up project', () => {
  it('«Gjør om til overordnet prosjekt» saves the menu for the site before it starts the setup', async () => {
    const { added } = renderDialog(CreateParentDialog, 'CreateParentDialog')
    fireEvent.click(screen.getByRole('button', { name: strings.RedoText }))
    await waitFor(() => expect(added).toHaveLength(1))
    expect(JSON.parse(added[0].saved)).toEqual({ webUrl: PROJECT, nodes: NODES })
    expect(JSON.parse(added[0].action.ClientSideComponentProperties).forceTemplate).toBeTruthy()
    expect(screen.queryByText(strings.SetupMenuNotSavedTitle)).toBeNull()
  })

  it('«Kjør oppsettveiviser» saves the menu for the site, and lets the user pick the template', async () => {
    const { added } = renderDialog(RunProjectSetupDialog, 'RunProjectSetupDialog')
    fireEvent.click(screen.getByRole('button', { name: strings.ConfirmText }))
    await waitFor(() => expect(added).toHaveLength(1))
    expect(JSON.parse(added[0].saved)).toEqual({ webUrl: PROJECT, nodes: NODES })
    expect(JSON.parse(added[0].action.ClientSideComponentProperties).forceTemplate).toBe(
      '__SELECT_TEMPLATE__'
    )
    expect(sessionStorage.getItem('pp_skipAlreadySetupCheck')).toBe('true')
    expect(screen.queryByText(strings.SetupMenuNotSavedTitle)).toBeNull()
  })

  // The setup extension every installation has (`ProjectSetup` in channels/main.json, and in the
  // site script that puts the setup on a new site). A site in English got the `i18n` channel's
  // id, which no release installs, and the setup never started.
  it.each([
    [
      '«Gjør om til overordnet prosjekt»',
      1044,
      CreateParentDialog,
      'CreateParentDialog',
      strings.RedoText
    ],
    [
      '«Gjør om til overordnet prosjekt»',
      1033,
      CreateParentDialog,
      'CreateParentDialog',
      strings.RedoText
    ],
    [
      '«Kjør oppsettveiviser»',
      1044,
      RunProjectSetupDialog,
      'RunProjectSetupDialog',
      strings.ConfirmText
    ],
    [
      '«Kjør oppsettveiviser»',
      1033,
      RunProjectSetupDialog,
      'RunProjectSetupDialog',
      strings.ConfirmText
    ]
  ])(
    '%s adds the setup extension the installation has, on a site with LCID %i',
    async (
      _name,
      language: number,
      Dialog: React.FC,
      activeDialog: string,
      primaryText: string
    ) => {
      const { added } = renderDialog(Dialog, activeDialog, undefined, language)
      fireEvent.click(screen.getByRole('button', { name: primaryText }))
      await waitFor(() => expect(added).toHaveLength(1))
      expect(added[0].action.Location).toBe('ClientSideExtension.ApplicationCustomizer')
      expect(added[0].action.ClientSideComponentId).toBe('ce34553d-ab47-4107-8dd1-e980d953996d')
    }
  )

  describe.each([
    [
      '«Gjør om til overordnet prosjekt»',
      CreateParentDialog,
      'CreateParentDialog',
      strings.RedoText
    ],
    ['«Kjør oppsettveiviser»', RunProjectSetupDialog, 'RunProjectSetupDialog', strings.ConfirmText]
  ])('%s', (_name, Dialog: React.FC, activeDialog: string, primaryText: string) => {
    it('is described by its question, which a screen reader reads as it opens (WCAG 1.3.1, 4.1.2)', () => {
      // The focus lands on «Avbryt»: named by its title alone, the dialog's question went unread.
      renderDialog(Dialog, activeDialog)
      const subText =
        Dialog === CreateParentDialog
          ? strings.CreateParentModalSubText
          : strings.RunProjectSetupDialogSubText
      expect(screen.getByRole('dialog')).toHaveAccessibleDescription(subText)
    })

    it('shows the spinner from the click, before the menu is read, and starts the setup once', async () => {
      const menu = pendingMenu()
      const { added, dispatch } = renderDialog(Dialog, activeDialog, menu.getMenuState)
      const primary = screen.getByRole('button', { name: primaryText })
      fireEvent.click(primary)
      expect(screen.getByText(strings.PleaseWaitText)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: primaryText })).toBeNull()
      expect(screen.queryByRole('button', { name: strings.CancelText })).toBeNull()

      fireEvent.click(primary)
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
      expect(dispatch).not.toHaveBeenCalled()
      expect(added).toHaveLength(0)

      menu.answer({ Nodes: NODES })
      await waitFor(() => expect(added).toHaveLength(1))
      await settle()
      expect(added).toHaveLength(1)
      expect(menu.getMenuState).toHaveBeenCalledTimes(1)
      expect(JSON.parse(added[0].saved)).toEqual({ webUrl: PROJECT, nodes: NODES })
    })

    it('says so when the menu cannot be saved, and «Fortsett likevel» starts the setup once', async () => {
      localStorage.setItem(
        NAVIGATION_NODES_STORAGE_KEY,
        JSON.stringify({ webUrl: 'https://contoso.sharepoint.com/sites/alfa', nodes: NODES })
      )
      const { added } = renderDialog(Dialog, activeDialog, () =>
        Promise.reject(new Error('Tilgang nektet'))
      )
      fireEvent.click(screen.getByRole('button', { name: primaryText }))
      expect(await screen.findByText(strings.SetupMenuNotSavedTitle)).toBeInTheDocument()
      expect(screen.getByText(strings.SetupMenuNotSavedText)).toBeInTheDocument()
      expect(screen.queryByText(strings.PleaseWaitText)).toBeNull()
      expect(screen.queryByRole('button', { name: primaryText })).toBeNull()
      expect(screen.getByRole('button', { name: strings.CancelText })).toHaveFocus()
      expect(added).toHaveLength(0)

      const continueAnyway = screen.getByRole('button', { name: strings.ContinueAnywayText })
      fireEvent.click(continueAnyway)
      fireEvent.click(continueAnyway)
      await waitFor(() => expect(added).toHaveLength(1))
      await settle()
      expect(added).toHaveLength(1)
      expect(added[0].saved).toBeNull()
    })

    it('starts nothing and closes when the user cancels after the menu could not be saved', async () => {
      const { added, dispatch } = renderDialog(Dialog, activeDialog, () =>
        Promise.reject(new Error('Tilgang nektet'))
      )
      fireEvent.click(screen.getByRole('button', { name: primaryText }))
      await screen.findByText(strings.SetupMenuNotSavedTitle)
      fireEvent.click(screen.getByRole('button', { name: strings.CancelText }))
      await settle()
      expect(dispatch).toHaveBeenCalledTimes(1)
      expect(dispatch).toHaveBeenCalledWith(CLOSE_DIALOG())
      expect(added).toHaveLength(0)
      expect(screen.queryByText(strings.SetupMenuNotSavedTitle)).toBeNull()
      expect(screen.getByRole('button', { name: primaryText })).toBeInTheDocument()
    })

    it('says so when the setup cannot be started, closes on «Lukk» and opens clean again', async () => {
      const { add, added, dispatch, setActiveDialog } = renderDialog(Dialog, activeDialog)
      add.mockImplementationOnce(() => Promise.reject(new Error(ACCESS_DENIED)))
      fireEvent.click(screen.getByRole('button', { name: primaryText }))
      expect(await screen.findByText(strings.SetupNotStartedTitle)).toBeInTheDocument()
      // Jest fails a test in which a promise rejects unhandled: give one the turn to surface.
      await settle()
      expect(screen.getByText(strings.SetupNotStartedText)).toBeInTheDocument()
      // SharePoint's own message, not PnPjs' request and JSON around it.
      expect(
        screen.getByText(format(strings.SetupNotStartedErrorText, 'Tilgang nektet.'))
      ).toBeInTheDocument()
      expect(screen.queryByText(/odata\.error/)).toBeNull()
      expect(ListLogger.log).toHaveBeenCalledTimes(1)
      expect(ListLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ACCESS_DENIED,
          level: 'Error',
          functionName: 'applyCustomAction',
          component: 'Project Information'
        })
      )
      expect(screen.queryByText(strings.PleaseWaitText)).toBeNull()
      expect(screen.queryByRole('button', { name: primaryText })).toBeNull()
      expect(screen.queryByRole('button', { name: strings.CancelText })).toBeNull()
      const closeButton = screen.getByRole('button', { name: strings.CloseText })
      expect(closeButton).toHaveFocus()
      expect(sessionStorage.getItem('pp_skipAlreadySetupCheck')).toBeNull()

      fireEvent.click(closeButton)
      await settle()
      expect(dispatch).toHaveBeenCalledTimes(1)
      expect(dispatch).toHaveBeenCalledWith(CLOSE_DIALOG())
      expect(add).toHaveBeenCalledTimes(1)
      expect(added).toHaveLength(0)

      setActiveDialog(null)
      setActiveDialog(activeDialog)
      expect(screen.queryByText(strings.SetupNotStartedTitle)).toBeNull()
      expect(screen.queryByRole('button', { name: strings.CloseText })).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: primaryText }))
      await waitFor(() => expect(added).toHaveLength(1))
      expect(add).toHaveBeenCalledTimes(2)
    })

    it('shows the failed start in place of the unsaved menu after «Fortsett likevel»', async () => {
      const { add } = renderDialog(Dialog, activeDialog, () =>
        Promise.reject(new Error('Tilgang nektet'))
      )
      add.mockImplementationOnce(() => Promise.reject(new Error('Failed to fetch')))
      fireEvent.click(screen.getByRole('button', { name: primaryText }))
      fireEvent.click(await screen.findByRole('button', { name: strings.ContinueAnywayText }))
      expect(await screen.findByText(strings.SetupNotStartedTitle)).toBeInTheDocument()
      await settle()
      expect(
        screen.getByText(format(strings.SetupNotStartedErrorText, 'Failed to fetch'))
      ).toBeInTheDocument()
      expect(screen.queryByText(strings.SetupMenuNotSavedTitle)).toBeNull()
      expect(screen.queryByRole('button', { name: strings.ContinueAnywayText })).toBeNull()
      expect(screen.getByRole('button', { name: strings.CloseText })).toHaveFocus()
    })
  })
})
