import { render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
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

  it('shows nothing for a project with no report, where it was a button with nothing in it', () => {
    const { container } = render(<StatusReportColumn item={{ SiteId: 's2' }} column={column} />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(container).toBeEmptyDOMElement()
  })
})
