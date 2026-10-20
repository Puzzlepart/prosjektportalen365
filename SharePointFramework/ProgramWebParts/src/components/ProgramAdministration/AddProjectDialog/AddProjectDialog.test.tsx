// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The list in the dialog is tested on its own.
jest.mock('../ProjectList', () => ({ ProjectList: (): null => null }))

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import strings from 'ProgramWebPartsStrings'
import * as React from 'react'
import { ProgramAdministrationContext } from '../context'
import { ADD_CHILD_PROJECTS, DATA_LOADED, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'
import { AddProjectDialog } from './AddProjectDialog'

/**
 * The dialog that adds projects to the program: named by its title, it fetches the projects of the
 * program's hubs, adds the chosen ones under the program's hub, and closes on cancel or Escape.
 */
describe('AddProjectDialog', () => {
  it('is named by its title, a heading of its own and not one inside another (WCAG 1.3.1, 4.1.2)', () => {
    const value = {
      props: {
        context: { pageContext: { site: { id: 'site' }, legacyPageContext: {} } },
        dataAdapter: {}
      },
      state: {
        addProjectDialog: { open: true, selectedProjects: [] },
        availableProjects: [],
        childProjects: []
      },
      programHubs: [],
      dispatch: jest.fn()
    } as any
    render(
      <ProgramAdministrationContext.Provider value={value}>
        <AddProjectDialog />
      </ProgramAdministrationContext.Provider>
    )
    const name = strings.ProgramAdministrationAddChildsButtonLabel
    const heading = screen.getByRole('heading', { level: 2, name })
    expect(heading.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull()
    expect(screen.getByRole('dialog', { name })).toBeInTheDocument()
  })

  it("adds the chosen projects under the program's hub, and closes on cancel or Escape", async () => {
    const ALFA = { SiteId: 'a', Title: 'Alfa' }
    const addChildProjects = jest.fn(() => Promise.resolve())
    const getHubSiteProjects = jest.fn(() => Promise.resolve([ALFA]))
    const dispatch = jest.fn()
    const value = {
      props: {
        context: {
          pageContext: { site: { id: 'site' }, legacyPageContext: { hubSiteId: 'HUB-1' } }
        },
        dataAdapter: { addChildProjects, getHubSiteProjects }
      },
      state: {
        addProjectDialog: { open: true, selectedProjects: ['a'] },
        availableProjects: [ALFA],
        childProjects: []
      },
      programHubs: [{ url: 'https://t.sharepoint.com/sites/hub1', hubSiteId: 'hub-1' }],
      dispatch
    } as any
    render(
      <ProgramAdministrationContext.Provider value={value}>
        <AddProjectDialog />
      </ProgramAdministrationContext.Provider>
    )
    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        DATA_LOADED({ data: { availableProjects: [ALFA] }, scope: 'AddProjectDialog' })
      )
    )
    fireEvent.click(screen.getByRole('button', { name: strings.Add }))
    await waitFor(() =>
      expect(addChildProjects).toHaveBeenCalledWith([ALFA], 'https://t.sharepoint.com/sites/hub1')
    )
    expect(dispatch).toHaveBeenCalledWith(ADD_CHILD_PROJECTS([ALFA]))
    fireEvent.click(screen.getByRole('button', { name: strings.Cancel }))
    expect(dispatch).toHaveBeenLastCalledWith(TOGGLE_ADD_PROJECT_DIALOG())
    dispatch.mockClear()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(dispatch).toHaveBeenCalledWith(TOGGLE_ADD_PROJECT_DIALOG())
  })

  it("lists none when the hubs' projects cannot be fetched, and asks no hub it cannot name", async () => {
    const dialog = (programHubs: any[], getHubSiteProjects: jest.Mock) => {
      const dispatch = jest.fn()
      render(
        <ProgramAdministrationContext.Provider
          value={
            {
              props: {
                context: { pageContext: { site: { id: 'site' }, legacyPageContext: {} } },
                dataAdapter: { getHubSiteProjects }
              },
              state: {
                addProjectDialog: { open: true, selectedProjects: [] },
                availableProjects: [],
                childProjects: []
              },
              programHubs,
              dispatch
            } as any
          }
        >
          <AddProjectDialog />
        </ProgramAdministrationContext.Provider>
      )
      return dispatch
    }
    const dispatch = dialog(
      [{ url: 'https://t.sharepoint.com/sites/hub1', hubSiteId: 'hub-1' }],
      jest.fn(() => Promise.reject(new Error('Ingen tilgang')))
    )
    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        DATA_LOADED({ data: { availableProjects: [] }, scope: 'AddProjectDialog' })
      )
    )
    cleanup()
    const getHubSiteProjects = jest.fn()
    dialog([{ url: 'https://t.sharepoint.com/sites/hub1' }], getHubSiteProjects)
    expect(getHubSiteProjects).not.toHaveBeenCalled()
  })

  it("adds the projects with no hub address when the program's hub is not among its hubs", async () => {
    const ALFA = { SiteId: 'a', Title: 'Alfa' }
    const addChildProjects = jest.fn(() => Promise.resolve())
    render(
      <ProgramAdministrationContext.Provider
        value={
          {
            props: {
              context: {
                pageContext: { site: { id: 'site' }, legacyPageContext: { hubSiteId: 'hub-9' } }
              },
              dataAdapter: {
                addChildProjects,
                getHubSiteProjects: jest.fn(() => Promise.resolve([ALFA]))
              }
            },
            state: {
              addProjectDialog: { open: true, selectedProjects: ['a'] },
              availableProjects: [ALFA],
              childProjects: []
            },
            programHubs: [{ url: 'https://t.sharepoint.com/sites/hub1', hubSiteId: 'hub-1' }],
            dispatch: jest.fn()
          } as any
        }
      >
        <AddProjectDialog />
      </ProgramAdministrationContext.Provider>
    )
    fireEvent.click(screen.getByRole('button', { name: strings.Add }))
    await waitFor(() => expect(addChildProjects).toHaveBeenCalledWith([ALFA], undefined))
  })

  it('says why the projects could not be added, and stays open (WCAG 3.3.1, 4.1.3)', async () => {
    // The failure was not caught: nothing was added, and nothing said so.
    const ALFA = { SiteId: 'a', Title: 'Alfa' }
    const dispatch = jest.fn()
    render(
      <ProgramAdministrationContext.Provider
        value={
          {
            props: {
              context: {
                pageContext: { site: { id: 'site' }, legacyPageContext: { hubSiteId: 'HUB-1' } }
              },
              dataAdapter: {
                addChildProjects: jest.fn(() =>
                  Promise.reject(new Error('Ingen tilgang til huben'))
                ),
                getHubSiteProjects: jest.fn(() => Promise.resolve([ALFA]))
              }
            },
            state: {
              addProjectDialog: { open: true, selectedProjects: ['a'] },
              availableProjects: [ALFA],
              childProjects: []
            },
            programHubs: [{ url: 'https://t.sharepoint.com/sites/hub1', hubSiteId: 'hub-1' }],
            dispatch
          } as any
        }
      >
        <AddProjectDialog />
      </ProgramAdministrationContext.Provider>
    )
    fireEvent.click(screen.getByRole('button', { name: strings.Add }))
    expect(await screen.findByText(strings.AddProjectsErrorTitle)).toBeInTheDocument()
    expect(screen.getByText('Ingen tilgang til huben')).toBeInTheDocument()
    expect(dispatch).not.toHaveBeenCalledWith(ADD_CHILD_PROJECTS([ALFA]))
    expect(dispatch).not.toHaveBeenCalledWith(TOGGLE_ADD_PROJECT_DIALOG())
  })

  it('lets the keyboard reach add before a project is chosen, and says what it needs (WCAG 2.1.1, 3.3.2)', () => {
    render(
      <ProgramAdministrationContext.Provider
        value={
          {
            props: {
              context: { pageContext: { site: { id: 'site' }, legacyPageContext: {} } },
              dataAdapter: {}
            },
            state: {
              addProjectDialog: { open: true, selectedProjects: [] },
              availableProjects: [],
              childProjects: []
            },
            programHubs: [],
            dispatch: jest.fn()
          } as any
        }
      >
        <AddProjectDialog />
      </ProgramAdministrationContext.Provider>
    )
    const add = screen.getByRole('button', { name: strings.Add })
    expect(add).toHaveAttribute('aria-disabled', 'true')
    expect(add).toHaveAccessibleDescription(strings.AddProjectsDisabledReason)
  })
})
