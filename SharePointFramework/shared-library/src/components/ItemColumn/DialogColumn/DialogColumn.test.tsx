// The grid inside the dialog is stubbed with a plain table over the real column definitions. The
// grid has its own suite; here it only needs to show what the dialog hands it. Rendering the real
// DataGrid inside the modal takes milliseconds locally and more than Jest's five seconds on the CI
// runner, for reasons that stay inside Fluent's focus and sizing machinery under jsdom.
jest.mock('../../DataGridList', () => {
  const React = jest.requireActual('react')
  return {
    DataGridList: ({ items, columns }: { items: any[]; columns: any[] }) => (
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.columnId}>{column.renderHeaderCell()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.columnId}>{column.renderCell(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import strings from 'SharedLibraryStrings'
import { DialogColumn } from './index'

/**
 * The measurements cell: a link that opens a dialog listing the measurements behind a benefit.
 * Asserted through the link, the dialog role and the text in it. The rows are drawn by the stub
 * above from the dialog's real columns, so a column that stops rendering its value fails here.
 */

const measurements = [
  {
    Value: 5,
    ValueDisplay: '5',
    Comment: 'Første måling',
    AchievementDisplay: '50 %',
    DateDisplay: '01.03.2026'
  },
  {
    Value: 8,
    ValueDisplay: '8',
    Comment: 'Andre måling',
    AchievementDisplay: '80 %',
    DateDisplay: '01.06.2026'
  }
]

function renderCell(items: unknown[] = measurements, props: Record<string, any> = {}) {
  return render(
    <DialogColumn
      item={{ Title: 'Gevinst 1', GtDesiredValue: '10' }}
      column={{ key: 'Measurements', name: 'Målinger', minWidth: 100 } as any}
      columnValue={JSON.stringify(items)}
      headerTitleField='Title'
      headerSubTitleField='GtDesiredValue'
      {...props}
    />
  )
}

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

/**
 * Opening the dialog is load-sensitive: in isolation it appears within milliseconds, but with every
 * suite running at once on a busy machine — the CI runner, or a full local rebuild — the worker is
 * starved and the default one-second wait elapses before it does, while the click itself can run
 * past Jest's five-second test limit. The waits below are sized for that load, which does not hide
 * a failure: a dialog that never opens still fails, just later.
 */
const DIALOG_TIMEOUT = 10_000
const TEST_TIMEOUT = 20_000

/**
 * The open dialog. Found with `hidden: true` because Tabster, Fluent's focus manager, marks every
 * dialog surface `aria-hidden` while it is not the *active* one — on a timer keyed to where focus
 * is — and under load that state has been seen to outlast the query, with the dialog open and its
 * rows rendered. The dialog unmounts when closed, so a surface that is found is an open one.
 */
const findDialog = () => screen.findByRole('dialog', { hidden: true }, { timeout: DIALOG_TIMEOUT })

describe('DialogColumn', () => {
  it('shows a link with the default text', () => {
    renderCell()
    expect(screen.getByText(strings.ShowAllMeasurementsLinkText)).toBeInTheDocument()
  })

  it('shows a link with the configured text', () => {
    renderCell(measurements, { linkText: 'Se målinger' })
    expect(screen.getByText('Se målinger')).toBeInTheDocument()
  })

  it(
    'opens a dialog with the title and the measurements',
    async () => {
      const user = setupUser()
      renderCell()
      await user.click(screen.getByText(strings.ShowAllMeasurementsLinkText))
      const dialog = await findDialog()
      expect(dialog).toHaveTextContent('Gevinst 1')
      expect(dialog).toHaveTextContent(strings.MeasurementValueLabel)
      expect(dialog).toHaveTextContent('Første måling')
      expect(dialog).toHaveTextContent('80 %')
      expect(dialog).toHaveTextContent('01.06.2026')
    },
    TEST_TIMEOUT
  )

  it(
    'says so when there are no measurements',
    async () => {
      const user = setupUser()
      renderCell([])
      await user.click(screen.getByText(strings.ShowAllMeasurementsLinkText))
      const dialog = await findDialog()
      expect(dialog).toHaveTextContent(strings.ModalColumnEmptyListTitle)
    },
    TEST_TIMEOUT
  )
})
