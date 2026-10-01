import { getId } from './getId'

describe('getId', () => {
  it('prefixes the id with the given prefix', () => {
    expect(getId('name')).toMatch(/^name\d+$/)
  })

  it('uses the v8 default prefix when none is given', () => {
    expect(getId()).toMatch(/^id__\d+$/)
  })

  it('never hands out the same id twice', () => {
    const ids = Array.from({ length: 500 }, () => getId('dup'))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('counts across prefixes, so two prefixes never collide on the suffix', () => {
    const a = getId('a')
    const b = getId('b')
    expect(a.slice(1)).not.toBe(b.slice(1))
  })

  it('shares its counter through the window, so a second copy of the library continues it', () => {
    const first = getId('shared')
    // Two solutions on the same page each bundle their own copy of the shared
    // library; the counter lives on `window` precisely so their ids differ.
    const counter = (window as any).__pp365CurrentId__
    expect(typeof counter).toBe('number')
    expect(Number(first.replace('shared', ''))).toBe(counter - 1)
  })
})
