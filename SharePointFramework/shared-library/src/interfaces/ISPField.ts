/**
 * Describes the SharePoint field metadata needed for value mapping.
 */
export interface ISPField {
  Id: string
  TextField: string
  InternalName: string
  Title: string
  SchemaXml: string
  TypeAsString: string
  Hidden: boolean
}
