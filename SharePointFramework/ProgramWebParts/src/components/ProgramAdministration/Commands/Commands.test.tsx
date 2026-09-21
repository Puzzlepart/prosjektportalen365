import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as strings from 'ProgramWebPartsStrings'
import { Commands } from './Commands'
import { ProgramAdministrationContext, IProgramAdministrationContext } from '../context'
import { REMOVE_CHILD_PROJECTS, SET_IS_DELETING, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'

/**
 * Builds a minimal context: only the fields Commands reads. The data adapter is a plain object
 * with the one method the component calls, so no PnPjs is involved.
 */
function renderCommands(overrides: Partial<IProgramAdministrationContext['state']> = {}) {
  const dispatch = jest.fn()
  const removeChildProjects = jest.fn().mockResolvedValue(undefined)
  const value = {
    props: { dataAdapter: { removeChildProjects } },
    state: {
      userHasManagePermission: true,
      isDeleting: false,
      selectedProjects: ['site-a'],
      childProjects: [{ SiteId: 'site-a' }, { SiteId: 'site-b' }],
      ...overrides
    },
    dispatch
  } as unknown as IProgramAdministrationContext
  render(
    <ProgramAdministrationContext.Provider value={value}>
      <Commands />
    </ProgramAdministrationContext.Provider>
  )
  return { dispatch, removeChildProjects }
}

describe('ProgramAdministration Commands', () => {
  it('opens the add dialog', async () => {
    const { dispatch } = renderCommands()
    await userEvent.setup().click(screen.getByText(strings.ProgramAdministrationAddChildsButtonLabel))
    expect(dispatch).toHaveBeenCalledWith(TOGGLE_ADD_PROJECT_DIALOG())
  })

  it('removes the selected child projects and reports it', async () => {
    const { dispatch, removeChildProjects } = renderCommands()
    await userEvent.setup().click(screen.getByText(strings.ProgramRemoveChildsButtonLabel))
    expect(dispatch).toHaveBeenCalledWith(SET_IS_DELETING(true))
    expect(removeChildProjects).toHaveBeenCalledWith([{ SiteId: 'site-a' }])
    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(REMOVE_CHILD_PROJECTS({ siteIdsToRemove: ['site-a'] }))
    )
  })

  it('disables both commands without manage permission', () => {
    renderCommands({ userHasManagePermission: false })
    expect(screen.getByText(strings.ProgramAdministrationAddChildsButtonLabel).closest('button')).toBeDisabled()
    expect(screen.getByText(strings.ProgramRemoveChildsButtonLabel).closest('button')).toBeDisabled()
  })
})
