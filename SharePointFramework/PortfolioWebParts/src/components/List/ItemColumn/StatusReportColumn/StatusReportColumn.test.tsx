import { render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import resource from 'SharedResources'
import { fetchData } from './data'
import { StatusReportColumn } from './StatusReportColumn'

/**
 * The status report cell: an icon per section of the project's latest report, which opens the
 * report's statuses. Fluent's popover trigger makes the icons a button, which the keyboard reaches.
 */
const STATUS = {
  siteId: 's1',
  scopeKey: '',
  created: '5. okt. 2026',
  sections: [
    {
      fieldName: 'GtCostStatus',
      name: 'Kostnad',
      iconName: 'Money',
      value: 'Grønn',
      color: '#107c10'
    },
    {
      fieldName: 'GtTimeStatus',
      name: 'Fremdrift',
      iconName: 'Clock',
      value: 'I rute',
      color: '#107c10'
    }
  ]
}
const column = { key: 'status', fieldName: 'status', name: 'Status', data: { $: [STATUS] } } as any

describe('StatusReportColumn', () => {
  it("is a button named by each section's status, which the icons only show by colour (WCAG 4.1.2)", () => {
    render(<StatusReportColumn item={{ SiteId: 's1' }} column={column} />)
    const statuses = ['Kostnad: Grønn', 'Fremdrift: I rute'].join(', ')
    expect(
      screen.getByRole('button', {
        name: format(strings.NameValueLabel, strings.ColumnRenderOptionStatusReport, statuses)
      })
    ).toBeInTheDocument()
  })

  it('has a mark beside each icon whose shape tells the status, as the colour does (WCAG 1.4.1)', () => {
    const status = {
      ...STATUS,
      sections: [
        { ...STATUS.sections[0], color: '#2da748' },
        { ...STATUS.sections[1], color: '#e9b359' },
        {
          fieldName: 'GtStatusQuality',
          name: 'Kvalitet',
          iconName: 'Ribbon',
          value: 'Store avvik',
          color: '#ea5c73',
          statusIconName: 'Flag'
        }
      ]
    }
    const { container } = render(
      <StatusReportColumn item={{ SiteId: 's1' }} column={{ ...column, data: { $: [status] } }} />
    )
    const marks = Array.from(container.querySelectorAll('[data-status-mark]'))
    expect(marks.map((mark) => mark.getAttribute('data-status-mark'))).toEqual([
      'CheckmarkCircle',
      'Warning',
      'Flag'
    ])
  })

  it("gives each section its status value's own icon from the column configuration", async () => {
    const lists: Record<string, any[]> = {
      [resource.Lists_ProjectStatus_Title]: [
        { GtSiteId: 's1', Created: '2026-10-05', GtStatusTime: 'I rute', GtStatusTimeComment: '' }
      ],
      [resource.Lists_StatusSections_Title]: [
        { GtSecFieldName: 'GtStatusTime', GtSecIcon: 'Clock' }
      ],
      [resource.Lists_ProjectColumnConfiguration_Title]: [
        {
          GtPortfolioColumn: { Title: 'Status fremdrift', GtInternalName: 'GtStatusTime' },
          GtPortfolioColumnValue: 'I rute',
          GtPortfolioColumnColor: '#2da748',
          GtPortfolioColumnIconName: 'CheckmarkCircle'
        }
      ]
    }
    const selected: Record<string, string[]> = {}
    // A stand-in for PnPjs' queryable: every method returns it, and calling it returns the list.
    const query = (title: string) => {
      const chain: any = new Proxy(() => Promise.resolve(lists[title]), {
        get: (_target, method) =>
          method === 'items'
            ? chain
            : (...args: string[]) => {
                if (method === 'select') selected[title] = args
                return chain
              }
      })
      return chain
    }
    const web = { lists: { getByTitle: query } }
    const [report] = await fetchData(web as any, { data: { dataTypeProperties: {} } } as any)
    expect(selected[resource.Lists_ProjectColumnConfiguration_Title]).toContain(
      'GtPortfolioColumnIconName'
    )
    expect(report.sections).toEqual([
      expect.objectContaining({
        fieldName: 'GtStatusTime',
        name: 'Fremdrift',
        iconName: 'Clock',
        value: 'I rute',
        color: '#2da748',
        statusIconName: 'CheckmarkCircle'
      })
    ])
  })

  it('shows nothing for a project with no report, where it was a button with nothing in it', () => {
    const { container } = render(<StatusReportColumn item={{ SiteId: 's2' }} column={column} />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(container).toBeEmptyDOMElement()
  })
})
