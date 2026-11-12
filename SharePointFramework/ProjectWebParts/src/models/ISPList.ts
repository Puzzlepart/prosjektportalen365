/** List metadata needed to edit items and resolve taxonomy fields. */
export interface ISPList {
  Id: string
  DefaultEditFormUrl: string
  Fields: { InternalName: string; TypeAsString: string; TextField: string; Id: string }[]
}
