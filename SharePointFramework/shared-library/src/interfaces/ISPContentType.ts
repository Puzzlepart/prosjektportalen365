import { ISPField } from './ISPField'

/**
 * Describes a SharePoint content type and its fields and field links.
 */
export interface ISPContentType {
  StringId: string
  Name: string
  Fields: ISPField[]
  FieldLinks?: { Name: string; Required: boolean }[]
}
