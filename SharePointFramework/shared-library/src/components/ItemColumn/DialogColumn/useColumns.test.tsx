import { render, screen } from '@testing-library/react'
import * as React from 'react'
import strings from 'SharedLibraryStrings'
import { useColumns } from './useColumns'

/**
 * The measurement columns in the dialog. The achievement cell shows the achievement text and, when
 * the measurement carries one, its trend icon. Asserted on the text and on whether an icon element
 * is present, not on which icon library drew it: v8 renders an `<i>`, v9 an inline `<svg>`.
 */

/**
 * Renders one column's cell for one item, the way the dialog's grid does.
 */
const Cell: React.FC<{ columnId: string; item: Record<string, any> }> = ({ columnId, item }) => {
  const column = useColumns().find((c) => c.columnId === columnId)
  return <>{column.renderCell(item)}</>
}

const hasIcon = (container: HTMLElement) => container.querySelector('i, svg') !== null

describe('DialogColumn columns', () => {
  it('has a column for value, comment, achievement and date, in that order', () => {
    const Headers: React.FC = () => (
      <>
        {useColumns().map((c) => (
          <div key={c.columnId}>{c.renderHeaderCell()}</div>
        ))}
      </>
    )
    render(<Headers />)
    expect(screen.getByText(strings.MeasurementValueLabel)).toBeInTheDocument()
    expect(screen.getByText(strings.MeasurementCommentLabel)).toBeInTheDocument()
    expect(screen.getByText(strings.MeasurementAchievementLabel)).toBeInTheDocument()
    expect(screen.getByText(strings.MeasurementDateLabel)).toBeInTheDocument()
  })

  describe('the achievement cell', () => {
    it('shows the achievement', () => {
      render(<Cell columnId='achievement' item={{ AchievementDisplay: '75 %' }} />)
      expect(screen.getByText('75 %')).toBeInTheDocument()
    })

    it('shows the trend icon when the measurement has one', () => {
      const { container } = render(
        <Cell
          columnId='achievement'
          item={{ AchievementDisplay: '75 %', TrendIcon: { iconName: 'Trophy', color: 'gold' } }}
        />
      )
      expect(hasIcon(container)).toBe(true)
    })

    it('shows no icon when the measurement has none', () => {
      const { container } = render(
        <Cell columnId='achievement' item={{ AchievementDisplay: '75 %' }} />
      )
      expect(hasIcon(container)).toBe(false)
    })
  })
})
