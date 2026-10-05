import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import { ProjectInformationContextProvider } from '../context'
import { Actions } from './index'

/**
 * The action buttons under the properties: which the user's permissions and the project's kind
 * allow, the ones the web part hides, the custom ones, and what a click opens.
 */
function renderActions(state: Record<string, any> = {}, props: Record<string, any> = {}) {
  const dispatch = jest.fn()
  render(
    <ProjectInformationContextProvider
      value={
        {
          props: {
            title: 'Prosjektinformasjon',
            hideActions: [],
            customActions: [],
            webServerRelativeUrl: '/sites/alfa',
            adminPageLink: 'Admin.aspx',
            ...props
          },
          state: {
            data: { versionHistoryUrl: '/versions' },
            userHasEditPermission: true,
            ...state
          },
          dispatch
        } as any
      }
    >
      <Actions />
    </ProjectInformationContextProvider>
  )
  return dispatch
}

const showAll = format(strings.ShowAllProjectInformationText, 'prosjektinformasjon')
const edit = format(strings.EditProjectInformationText, 'prosjektinformasjon')

describe('Actions', () => {
  it('offers to show all and to edit to a user with the edit permission', async () => {
    const user = userEvent.setup()
    const dispatch = renderActions()
    expect(screen.getByRole('button', { name: showAll })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.ViewVersionHistoryText })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: edit }))
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'OPEN_PANEL', payload: 'EditPropertiesPanel' })
    )
    await user.click(screen.getByRole('button', { name: showAll }))
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'OPEN_PANEL', payload: 'AllPropertiesPanel' })
    )
  })

  it('hides editing without the permission, and the setup actions without theirs', () => {
    renderActions({ userHasEditPermission: false, userHasRerunSetupPermission: false })
    expect(screen.getByRole('button', { name: showAll })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: edit })).toBeNull()
    expect(screen.queryByRole('button', { name: strings.CreateParentProjectLabel })).toBeNull()
    expect(screen.queryByRole('button', { name: strings.RunProjectSetupLabel })).toBeNull()
  })

  it('offers the parent-project actions by the project kind', async () => {
    const user = userEvent.setup()
    const dispatch = renderActions({ userHasRerunSetupPermission: true, isParentProject: false })
    expect(screen.queryByRole('button', { name: strings.ChildProjectAdminLabel })).toBeNull()
    await user.click(screen.getByRole('button', { name: strings.CreateParentProjectLabel }))
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'OPEN_DIALOG', payload: 'CreateParentDialog' })
    )
    expect(screen.getByRole('button', { name: strings.RunProjectSetupLabel })).toBeInTheDocument()
  })

  it('lets a parent project administer its children instead of becoming one', () => {
    renderActions({ userHasRerunSetupPermission: true, isParentProject: true })
    expect(screen.getByRole('button', { name: strings.ChildProjectAdminLabel })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: strings.CreateParentProjectLabel })).toBeNull()
  })

  it('leaves out the actions the web part hides, adds the custom ones, and shows none in edit mode', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()
    renderActions(
      {},
      {
        hideActions: ['showAllProjectInformationAction'],
        customActions: [['Egen handling', onClick, () => null, false]]
      }
    )
    expect(screen.queryByRole('button', { name: showAll })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Egen handling' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows no actions at all when every action is hidden or the page is in edit mode', () => {
    renderActions({}, { hideAllActions: true })
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
