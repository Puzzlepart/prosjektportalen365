import { recordTemplate } from './templateRecord'

/** The template a setup applied. */
const template = (text: string, isProgram = false, isParentProject = false) => ({
  text,
  isProgram,
  isParentProject
})

/** An extension with the title `text`. */
const extension = (text: string) => ({ text })

/** The no-template option («Ikke legg på mal på området»). */
const NO_TEMPLATE = template('Ingen mal')

describe('recordTemplate', () => {
  it('records the template and the extensions the setup applied', () => {
    expect(
      recordTemplate(template('Veiprosjekt'), [extension('Veimal'), extension('Fasesider')])
    ).toEqual({
      GtIsProgram: false,
      GtIsParentProject: false,
      GtProjectTemplate: 'Veiprosjekt',
      GtProjectExtensions: 'Veimal, Fasesider'
    })
  })

  it('keeps the template of a project and adds the new extensions, when no template is applied', () => {
    // Row 19 of the stress test: «Ingen mal» and only the new extension replaced Veiprosjekt and
    // Veimal, so the front page lost the template's field settings.
    expect(
      recordTemplate(NO_TEMPLATE, [extension('Flat dokumentvisning med bane')], {
        GtProjectTemplate: 'Veiprosjekt',
        GtProjectExtensions: 'Veimal',
        GtIsProgram: false,
        GtIsParentProject: false
      })
    ).toEqual({
      GtIsProgram: false,
      GtIsParentProject: false,
      GtProjectTemplate: 'Veiprosjekt',
      GtProjectExtensions: 'Veimal, Flat dokumentvisning med bane'
    })
  })

  it('keeps a program a program, and a parent project a parent', () => {
    expect(
      recordTemplate(NO_TEMPLATE, [], {
        GtProjectTemplate: 'Programmal',
        GtIsProgram: true,
        GtIsParentProject: false
      })
    ).toMatchObject({ GtIsProgram: true, GtProjectTemplate: 'Programmal' })
    expect(
      recordTemplate(NO_TEMPLATE, [], {
        GtProjectTemplate: 'Standardmal',
        GtIsProgram: false,
        GtIsParentProject: true
      })
    ).toMatchObject({ GtIsParentProject: true })
  })

  it('adds an extension the project has only once', () => {
    expect(
      recordTemplate(NO_TEMPLATE, [extension('Veimal')], {
        GtProjectTemplate: 'Veiprosjekt',
        GtProjectExtensions: 'Veimal'
      }).GtProjectExtensions
    ).toBe('Veimal')
  })

  it('records the no-template option where the project has recorded nothing', () => {
    expect(recordTemplate(NO_TEMPLATE, [extension('Fasesider')], {})).toEqual({
      GtIsProgram: false,
      GtIsParentProject: false,
      GtProjectTemplate: 'Ingen mal',
      GtProjectExtensions: 'Fasesider'
    })
  })
})
