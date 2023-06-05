import { ISPField } from './ISPField'

export interface ISPContentType {
  StringId: string
  Name: string
  Fields: ISPField[]
  FieldLinks?: { Name: string; Required: boolean }[]
}
