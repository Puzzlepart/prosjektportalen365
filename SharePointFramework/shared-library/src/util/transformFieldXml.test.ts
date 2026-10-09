import { transformFieldXml } from './transformFieldXml'

/**
 * The field XML the project setup and the portal data service hand to SharePoint's
 * `createFieldAsXml`: the site-bound attributes go, the given ones are set, and the rest of the
 * field (its children, its text, characters that need escaping) comes back unchanged.
 */
const CHOICE_FIELD =
  '<Field Type="Choice" DisplayName="Status for risiko &amp; tiltak" Required="TRUE" ' +
  'ID="{6a8a6e9c-1c0c-4c43-9e66-6c0a4f8a6b1e}" Name="GtRiskStatus" StaticName="GtRiskStatus" ' +
  'SourceID="{0b5a3c4d-2b9c-4f7a-8f0a-3c2c0e6f1a2b}" Version="3" WebId="{9b2e1f6d-0c3a-4c1e-a7d6-5a9f3c4b2e1d}" ' +
  'List="{4f1c2b3a-9d8e-4c7b-a6f5-e4d3c2b1a0f9}">' +
  '<Default>Åpen</Default><CHOICES><CHOICE>Åpen</CHOICE><CHOICE>Lukket</CHOICE></CHOICES></Field>'

const parse = (xml: string) => new DOMParser().parseFromString(xml, 'text/xml').documentElement

describe('transformFieldXml', () => {
  it('drops the site-bound attributes and keeps the rest of the field as it was', () => {
    const field = parse(transformFieldXml(CHOICE_FIELD))
    for (const name of ['Version', 'SourceID', 'Required', 'WebId', 'List']) {
      expect(field.hasAttribute(name)).toBe(false)
    }
    expect(field.getAttribute('Type')).toBe('Choice')
    expect(field.getAttribute('Name')).toBe('GtRiskStatus')
    expect(field.getAttribute('ID')).toBe('{6a8a6e9c-1c0c-4c43-9e66-6c0a4f8a6b1e}')
    expect(field.getAttribute('DisplayName')).toBe('Status for risiko & tiltak')
    expect(field.getElementsByTagName('Default')[0].textContent).toBe('Åpen')
    expect(
      Array.from(field.getElementsByTagName('CHOICE')).map((choice) => choice.textContent)
    ).toEqual(['Åpen', 'Lukket'])
  })

  it('sets the given attributes, replacing one the field already has', () => {
    const field = parse(
      transformFieldXml(CHOICE_FIELD, { DisplayName: 'GtRiskStatus', Group: 'Prosjektportalen' })
    )
    expect(field.getAttribute('DisplayName')).toBe('GtRiskStatus')
    expect(field.getAttribute('Group')).toBe('Prosjektportalen')
  })

  it('removes only the attributes it is told to when given its own list', () => {
    const field = parse(transformFieldXml(CHOICE_FIELD, {}, ['Required']))
    expect(field.hasAttribute('Required')).toBe(false)
    expect(field.getAttribute('Version')).toBe('3')
  })

  it('escapes what XML must escape in the attributes it sets', () => {
    const xml = transformFieldXml('<Field Type="Text" Name="GtA" />', {
      DisplayName: 'Kost & nytte <2026> "ny"'
    })
    // `&`, `<` and `"` must be escaped in an attribute; `>` may stand or be escaped, so only the
    // round trip pins the value.
    expect(xml).toContain('Kost &amp; nytte &lt;2026')
    expect(xml).toContain('&quot;ny&quot;')
    expect(parse(xml).getAttribute('DisplayName')).toBe('Kost & nytte <2026> "ny"')
  })

  it('returns a field without children as a single element', () => {
    expect(transformFieldXml('<Field Type="Text" Name="GtA" Version="1"/>')).toBe(
      '<Field Type="Text" Name="GtA"/>'
    )
  })
})
