import { RiskActionItemContext, textBesidesTasks } from './types'

/** A task of the risk in Planner, not completed. */
const task = (id: string, title: string) => ({ id, title, isCompleted: '0' })

/** The risk with `ID` 7 as the customizer reads it: its action field and its Planner tasks. */
function risk(fieldValue: string, tasks: ReturnType<typeof task>[]) {
  const values: Record<string, unknown> = { ID: 7, Title: 'Leverandøren går konkurs' }
  return RiskActionItemContext.create(
    { fieldValue, listItem: { getValueByName: (name: string) => values[name] } } as any,
    { list: { serverRelativeUrl: '/sites/frisbee/Lists/Usikkerhet' } } as any,
    new Map([['7', { data: '', tasks, updated: '' }]])
  )
}

describe('textBesidesTasks', () => {
  it('gives the lines of the field that are not the title of a task, blank lines left out', () => {
    expect(
      textBesidesTasks('Ring leverandøren\r\n\r\nAvtal en reserve\n  \n Ring leverandøren ', [
        { title: 'Ring leverandøren' }
      ])
    ).toEqual(['Avtal en reserve'])
    expect(textBesidesTasks(undefined, [{ title: 'Ring leverandøren' }])).toEqual([])
    expect(textBesidesTasks('Ring leverandøren', [{ title: undefined }])).toEqual([
      'Ring leverandøren'
    ])
  })
})

describe('RiskActionItemContext.update', () => {
  it('writes the titles of the tasks, then the text besides the tasks the risk had and gets', () => {
    const updated = risk('Ring leverandøren\nAvtal en reserve\nFølg opp kontrakten', [
      task('task-1', 'Ring leverandøren'),
      task('task-2', 'Følg opp kontrakten')
    ]).update([task('task-1', 'Ring leverandøren i dag')])
    // The task renamed in Planner and the one deleted there take their old titles with them.
    expect(updated.fieldValue).toBe('Ring leverandøren i dag\nAvtal en reserve')
    expect(updated.hiddenFieldValues.tasks).toEqual([task('task-1', 'Ring leverandøren i dag')])
  })

  it('replaces the actions written by hand on a risk without tasks, as the popover says', () => {
    expect(
      risk('Ring leverandøren\nAvtal en reserve', []).update([task('task-1', 'Følg opp')])
        .fieldValue
    ).toBe('Følg opp')
  })

  it('writes the text it is told to keep after the titles', () => {
    expect(
      risk('Ring leverandøren, Avtal en reserve', []).update(
        [task('task-1', 'Ring leverandøren')],
        ['Avtal en reserve']
      ).fieldValue
    ).toBe('Ring leverandøren\nAvtal en reserve')
  })
})
