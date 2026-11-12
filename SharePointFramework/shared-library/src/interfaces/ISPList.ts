/**
 * Describes a list's edit form and field metadata.
 */
export interface ISPList {
  Id: string
  DefaultEditFormUrl: string
  Fields: { InternalName: string; TypeAsString: string; TextField: string; Id: string }[]
}
