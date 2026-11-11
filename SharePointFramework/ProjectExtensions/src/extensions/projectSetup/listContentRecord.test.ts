import { isAddedBefore, isListContentAdded, recordListContent } from './listContentRecord'

/** List content with the title `text`, all the record is read by. */
const content = (text: string) => ({ text })

describe('isListContentAdded', () => {
  it('finds a title the record names, as a whole title only', () => {
    const record = 'Fasesjekkpunkter, Planneroppgaver'
    expect(isListContentAdded(record, content('Fasesjekkpunkter'))).toBe(true)
    expect(isListContentAdded(record, content('Planneroppgaver'))).toBe(true)
    expect(isListContentAdded(record, content('Planner'))).toBe(false)
    expect(isListContentAdded(record, content('Tidslinjeelementer'))).toBe(false)
  })

  it('finds nothing in an empty record, nor list content without a title', () => {
    expect(isListContentAdded('', content('Fasesjekkpunkter'))).toBe(false)
    expect(isListContentAdded(undefined, content('Fasesjekkpunkter'))).toBe(false)
    expect(isListContentAdded('Fasesjekkpunkter', content(''))).toBe(false)
  })
})

describe('isAddedBefore', () => {
  it("leaves out the hub's list content the record names, but not a cloud template's", () => {
    const record = 'Fasesjekkpunkter'
    expect(isAddedBefore(record, { isCloudTemplate: false }, content('Fasesjekkpunkter'))).toBe(
      true
    )
    expect(isAddedBefore(record, null, content('Fasesjekkpunkter'))).toBe(true)
    expect(isAddedBefore(record, { isCloudTemplate: false }, content('Planneroppgaver'))).toBe(
      false
    )
    expect(isAddedBefore(record, { isCloudTemplate: true }, content('Fasesjekkpunkter'))).toBe(
      false
    )
  })
})

describe('recordListContent', () => {
  it('records the selection of a first run, as before', () => {
    expect(recordListContent('', [content('Fasesjekkpunkter'), content('Planneroppgaver')])).toBe(
      'Fasesjekkpunkter, Planneroppgaver'
    )
    expect(recordListContent(undefined, [])).toBe('')
  })

  it('keeps what earlier runs added, and adds each title once', () => {
    expect(recordListContent('Fasesjekkpunkter', [])).toBe('Fasesjekkpunkter')
    expect(
      recordListContent('Fasesjekkpunkter', [
        content('Planneroppgaver'),
        content('Fasesjekkpunkter'),
        content('Planneroppgaver'),
        content('')
      ])
    ).toBe('Fasesjekkpunkter, Planneroppgaver')
  })

  it('records no more than the column holds, 255 characters', () => {
    const long = 'x'.repeat(240)
    expect(recordListContent(long, [content('Fasesjekkpunkter'), content('Plan')])).toBe(
      `${long}, Plan`
    )
  })
})
