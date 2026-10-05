// The report actions and the data adapter reach SharePoint; all are stand-ins, registered before
// the imports because Heft runs Jest on CommonJS output without Babel (mocks are not hoisted).
const mockCreate = jest.fn()
const mockDelete = jest.fn()
const mockPublish = jest.fn()
jest.mock('./useCreateNewStatusReport', () => ({ useCreateNewStatusReport: () => mockCreate }))
jest.mock('./useDeleteReport', () => ({ useDeleteReport: () => mockDelete }))
jest.mock('./usePublishReport', () => ({ usePublishReport: () => mockPublish }))
jest.mock('../../../data', () => ({
  __esModule: true,
  default: { portalDataService: { getStatusReportAttachments: jest.fn() } }
}))

import { render } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import { ListMenuItem } from 'pp365-shared-library'
import * as React from 'react'
import { ProjectStatusContext } from '../context'
import { report } from '../testFixtures'
import { useToolbarItems } from './useToolbarItems'

/**
 * The status page's toolbar: the report commands and when each is allowed, the report history,
 * the snapshot and source links, and the report series selector with its options.
 */
function toolbar(state: Record<string, any>, props: Record<string, any> = {}) {
  const dispatch = jest.fn()
  const captured: { menuItems: ListMenuItem[]; farMenuItems: ListMenuItem[] } = {
    menuItems: [],
    farMenuItems: []
  }
  const Probe: React.FC = () => {
    Object.assign(captured, useToolbarItems())
    return null
  }
  render(
    <ProjectStatusContext.Provider
      value={
        {
          state: { data: { reports: [], scopeKeysWithReports: [] }, ...state },
          props,
          dispatch
        } as any
      }
    >
      <Probe />
    </ProjectStatusContext.Provider>
  )
  return { ...captured, dispatch }
}

const byText = (items: ListMenuItem[], text: string) => items.find((i) => i.text === text)
const published = report({}, { id: 2, snapshotUrl: '/snapshots/2.png' })
const draft = report({}, { id: 3, published: false })

describe('useToolbarItems', () => {
  it('allows a new report after a published one, but no editing, publishing or deleting of it', () => {
    const { menuItems, farMenuItems } = toolbar({
      selectedReport: published,
      data: { reports: [published], scopeKeysWithReports: [] },
      userHasAdminPermission: true
    })
    expect(byText(menuItems, strings.NewStatusReportLabel).disabled).toBe(false)
    expect(byText(menuItems, strings.EditReportButtonLabel).disabled).toBe(true)
    expect(byText(menuItems, strings.PublishReportButtonLabel).disabled).toBe(true)
    expect(byText(farMenuItems, strings.DeleteReportButtonLabel).disabled).toBe(true)
    expect(byText(farMenuItems, strings.GetSnapshotButtonLabel).disabled).toBeFalsy()
  })

  it('allows editing, publishing and deleting a draft, but no second draft', () => {
    const { menuItems, farMenuItems } = toolbar({
      selectedReport: draft,
      data: { reports: [draft, published], scopeKeysWithReports: [] },
      userHasAdminPermission: true
    })
    expect(byText(menuItems, strings.NewStatusReportLabel).disabled).toBe(true)
    expect(byText(menuItems, strings.NewStatusReportLabel).description).toBe(
      strings.UnpublishedStatusReportInfo
    )
    expect(byText(menuItems, strings.EditReportButtonLabel).disabled).toBe(false)
    expect(byText(menuItems, strings.PublishReportButtonLabel).disabled).toBe(false)
    expect(byText(farMenuItems, strings.DeleteReportButtonLabel).disabled).toBe(false)
    expect(byText(farMenuItems, strings.GetSnapshotButtonLabel).disabled).toBe(true)
  })

  it('runs the actions and opens the edit panel', () => {
    const { menuItems, farMenuItems, dispatch } = toolbar({
      selectedReport: draft,
      data: { reports: [draft], scopeKeysWithReports: [] },
      userHasAdminPermission: true
    })
    byText(menuItems, strings.PublishReportButtonLabel).onClick(null)
    expect(mockPublish).toHaveBeenCalledTimes(1)
    byText(farMenuItems, strings.DeleteReportButtonLabel).onClick(null)
    expect(mockDelete).toHaveBeenCalledTimes(1)
    byText(menuItems, strings.EditReportButtonLabel).onClick(null)
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'OPEN_PANEL', payload: { name: 'EditStatusPanel' } })
    )
  })

  it('disables every report command without the admin permission', () => {
    const { menuItems, farMenuItems } = toolbar({
      selectedReport: draft,
      data: { reports: [draft], scopeKeysWithReports: [] },
      userHasAdminPermission: false
    })
    expect(menuItems.map((i) => i.disabled)).toEqual([true, true, true])
    expect(byText(farMenuItems, strings.DeleteReportButtonLabel).disabled).toBe(true)
  })

  it('lists the reports in the history, enabled from the second report on', () => {
    const one = toolbar({
      selectedReport: published,
      data: { reports: [published], scopeKeysWithReports: [] }
    })
    const history = (items: ListMenuItem[]) => items.find((i) => i.icon === 'History')
    expect(history(one.farMenuItems).disabled).toBe(true)
    const two = toolbar({
      selectedReport: published,
      data: { reports: [draft, published], scopeKeysWithReports: [] }
    })
    expect(history(two.farMenuItems).disabled).toBeFalsy()
    expect(history(two.farMenuItems).items).toHaveLength(2)
  })

  it('links back to the source page when the status page was opened from one', () => {
    const { farMenuItems } = toolbar({ sourceUrl: '/sites/hub/SitePages/Porteføljeoversikt.aspx' })
    expect(byText(farMenuItems, strings.NavigateToSourceUrlText)).toBeDefined()
    expect(byText(toolbar({}).farMenuItems, strings.NavigateToSourceUrlText)).toBeUndefined()
  })

  describe('the report series selector', () => {
    const selector = (items: ListMenuItem[]) =>
      items.find((i) => i.description === strings.ScopeSelectorDescription)

    it('is hidden without multi-reporting and without scoped reports', () => {
      expect(selector(toolbar({}).farMenuItems).hidden).toBe(true)
    })

    it('offers the default series and the configured sub-projects, and selects one', () => {
      const { farMenuItems, dispatch } = toolbar(
        {},
        { multiReporting: true, subProjects: 'DP1|Delprosjekt 1\nDP2' }
      )
      const item = selector(farMenuItems)
      expect(item.hidden).toBe(false)
      expect(item.text).toBe(strings.DefaultScopeLabel)
      const options = item.items.filter((i) => i.type !== 'divider')
      expect(options.map((o) => o.text)).toEqual([
        strings.DefaultScopeLabel,
        'Delprosjekt 1',
        'DP2'
      ])
      options[1].onClick(null)
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SELECT_SCOPE', payload: { scopeKey: 'DP1' } })
      )
      // Choosing the series already selected does nothing.
      options[0].onClick(null)
      expect(dispatch).toHaveBeenCalledTimes(1)
    })

    it('keeps a series reachable whose key is no longer configured, and names the selected one', () => {
      const { farMenuItems } = toolbar(
        { selectedScope: 'DP1', data: { reports: [], scopeKeysWithReports: ['GAMMEL'] } },
        { multiReporting: true, subProjects: 'DP1|Delprosjekt 1' }
      )
      const item = selector(farMenuItems)
      expect(item.text).toBe('Delprosjekt 1')
      expect(item.items.filter((i) => i.type !== 'divider').map((o) => o.text)).toEqual([
        strings.DefaultScopeLabel,
        'Delprosjekt 1',
        'GAMMEL'
      ])
    })
  })
})
