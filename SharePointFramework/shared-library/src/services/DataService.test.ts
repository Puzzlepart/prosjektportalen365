import { SPField } from '../models'
import { DataService } from './DataService'

/** A service on the base, with the hooks the subclasses call opened for the test. */
class TestService extends DataService<{ url: string }> {
  public configure(configuration: { url: string }) {
    this.onConfigureStart(configuration)
    return this.onConfigured()
  }

  public get configuration() {
    return this._configuration
  }

  public mapFields(fields: SPField[]) {
    return this._mapFields(fields)
  }
}

const field = (schemaXml: string, internalName = 'GtStartDate') =>
  Object.assign(new SPField(), { InternalName: internalName, SchemaXml: schemaXml })

/**
 * The base of `PortalDataService` and `ProjectDataService`: configured once, and the mapping of
 * a field's form visibility, which SharePoint keeps only in the field's schema XML.
 */
describe('DataService', () => {
  it('is unconfigured until configured, and then keeps the configuration', () => {
    const service = new TestService()
    expect(service.isConfigured).toBe(false)
    const configuration = { url: 'https://contoso.sharepoint.com/sites/pp365' }
    expect(service.configure(configuration)).toBe(service)
    expect(service.isConfigured).toBe(true)
    expect(service.configuration).toBe(configuration)
    expect(new TestService(true).isConfigured).toBe(true)
  })

  it("reads a field's form visibility from its schema: shown unless the schema says FALSE", () => {
    const [hidden, shown, plain] = new TestService().mapFields([
      field('<Field ShowInEditForm="FALSE" ShowInNewForm="FALSE" ShowInDisplayForm="FALSE" />'),
      field('<Field ShowInEditForm="TRUE" ShowInNewForm="TRUE" ShowInDisplayForm="TRUE" />'),
      field('<Field />')
    ])
    expect(hidden).toMatchObject({
      ShowInEditForm: false,
      ShowInNewForm: false,
      ShowInDisplayForm: false
    })
    expect(shown).toMatchObject({
      ShowInEditForm: true,
      ShowInNewForm: true,
      ShowInDisplayForm: true
    })
    expect(plain).toMatchObject({
      ShowInEditForm: true,
      ShowInNewForm: true,
      ShowInDisplayForm: true
    })
  })

  it('keeps the rest of the field, and the fields in their order', () => {
    const mapped = new TestService().mapFields([
      field('<Field ShowInEditForm="FALSE" />', 'GtEndDate'),
      field('<Field />', 'Title')
    ])
    expect(mapped.map((f) => f.InternalName)).toEqual(['GtEndDate', 'Title'])
    expect(mapped[0].SchemaXml).toBe('<Field ShowInEditForm="FALSE" />')
  })
})
