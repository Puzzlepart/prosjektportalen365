import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import strings from 'SharedLibraryStrings'
import { DialogColumn } from './index'

/**
 * The measurements cell: a link that opens a dialog listing the measurements behind a benefit.
 * Asserted through the link, the dialog role and the text in it, so it holds whichever grid draws
 * the rows.
 */

const measurements = [
  { Value: 5, ValueDisplay: '5', Comment: 'Første måling', AchievementDisplay: '50 %', DateDisplay: '01.03.2026' },
  { Value: 8, ValueDisplay: '8', Comment: 'Andre måling', AchievementDisplay: '80 %', DateDisplay: '01.06.2026' }
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
 * The dialog renders a whole grid on open, and the first Fluent render in a Jest worker pays for
 * its style injection; on a shared CI runner that can take longer than the default one second.
 */
const findDialog = () => screen.findByRole('dialog', {}, { timeout: 5000 })

describe('DialogColumn', () => {
  it('shows a link with the default text', () => {
    renderCell()
    expect(screen.getByText(strings.ShowAllMeasurementsLinkText)).toBeInTheDocument()
  })

  it('shows a link with the configured text', () => {
    renderCell(measurements, { linkText: 'Se målinger' })
    expect(screen.getByText('Se målinger')).toBeInTheDocument()
  })

  it('opens a dialog with the title and the measurements', async () => {
    const user = setupUser()
    renderCell()
    await user.click(screen.getByText(strings.ShowAllMeasurementsLinkText))
    const dialog = await findDialog()
    expect(dialog).toHaveTextContent('Gevinst 1')
    expect(dialog).toHaveTextContent(strings.MeasurementValueLabel)
    expect(dialog).toHaveTextContent('Første måling')
    expect(dialog).toHaveTextContent('80 %')
    expect(dialog).toHaveTextContent('01.06.2026')
  })

  it('says so when there are no measurements', async () => {
    const user = setupUser()
    renderCell([])
    await user.click(screen.getByText(strings.ShowAllMeasurementsLinkText))
    const dialog = await findDialog()
    expect(dialog).toHaveTextContent(strings.ModalColumnEmptyListTitle)
  })
})
