import { withDefaults } from './withDefaults'

/**
 * `withDefaults` stands in for React's `defaultProps`: a missing or `undefined` prop takes the
 * default, every given value stays, including the falsy ones, and neither object is changed.
 */
describe('withDefaults', () => {
  interface IProps {
    title?: string
    rowLimit?: number
    hidden?: boolean
    items?: string[]
    description?: string | null
  }
  const defaults: Partial<IProps> = { title: 'Tittel', rowLimit: 6, hidden: true, items: [] }

  it('fills in what the caller left out or gave as undefined', () => {
    expect(withDefaults<IProps>({ rowLimit: undefined }, defaults)).toEqual({
      title: 'Tittel',
      rowLimit: 6,
      hidden: true,
      items: []
    })
  })

  it('keeps every given value, falsy ones included', () => {
    expect(
      withDefaults<IProps>({ title: '', rowLimit: 0, hidden: false, items: ['a'] }, defaults)
    ).toEqual({ title: '', rowLimit: 0, hidden: false, items: ['a'] })
  })

  it('applies a null default and keeps a given null', () => {
    const withNull: Partial<IProps> = { description: null }
    expect(withDefaults<IProps>({}, withNull).description).toBeNull()
    expect(withDefaults<IProps>({ description: null }, { description: 'x' }).description).toBeNull()
  })

  it('changes neither the props nor the defaults', () => {
    const props: IProps = { title: 'Mine' }
    const merged = withDefaults(props, defaults)
    expect(merged).not.toBe(props)
    expect(props).toEqual({ title: 'Mine' })
    expect(defaults.items).toEqual([])
    merged.items.push('b')
    expect(defaults.items).toEqual(['b'])
  })
})
