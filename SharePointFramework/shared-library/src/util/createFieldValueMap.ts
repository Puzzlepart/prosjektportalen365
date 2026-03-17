import { IPersonaProps } from '@fluentui/react'
import { ISPFieldUser } from '../interfaces'
import { EditableSPFieldValue } from '../models/EditableSPFieldValue'
import { getUserPhoto } from './getUserPhoto'

/**
 * Create a field value map that can be used to parse the field value
 * from the SharePoint REST API.
 */
export const createFieldValueMap = (): Map<string, (value: EditableSPFieldValue) => any> => {
  return new Map<string, (value: EditableSPFieldValue) => any>([
    [
      'URL',
      ({ value }) => {
        try {
          const url = value?.['Url']
          const description = value?.['Description']
          return { url, description }
        } catch (error) {
          throw new Error(`Feil ved mapping av URL felt: ${error}`)
        }
      }
    ],
    [
      'TaxonomyFieldType',
      ({ value, $ }) => {
        if ($ && typeof $ === 'object') {
          return [{ key: $.TermGuid, name: $.Label }].filter((t) => t.key || t.name)
        }
        if (typeof value === 'string') {
          return value.split(';').map((v) => ({ key: v, name: v }))
        }
        return []
      }
    ],
    [
      'TaxonomyFieldTypeMulti',
      ({ $, value }) => {
        if (Array.isArray($)) {
          return ($ as Array<{ TermGuid: string; Label: string }>).map((term) => ({
            key: term.TermGuid,
            name: term.Label
          }))
        }
        if (typeof value === 'string') {
          return value.split(';').filter(Boolean).map((v) => ({ key: v, name: v }))
        }
        return []
      }
    ],
    ['Date', ({ $ }) => new Date($)],
    ['DateTime', ({ $ }) => new Date($)],
    ['MultiChoice', ({ value }) => value?.split(', ')],
    [
      'User',
      ({ $ }) =>
        ([$].filter(Boolean) as ISPFieldUser[])?.map<IPersonaProps>(
          ({ Id: key, Title: text, EMail: secondaryText }) => ({
            key,
            text,
            secondaryText,
            imageUrl: getUserPhoto(secondaryText)
          })
        )
    ],
    [
      'UserMulti',
      ({ $ }) =>
        ($ as ISPFieldUser[])?.map<IPersonaProps>(
          ({ Id: key, Title: text, EMail: secondaryText }) => ({
            key,
            text,
            secondaryText,
            imageUrl: getUserPhoto(secondaryText)
          })
        )
    ],
    ['Currency', ({ $ }) => $]
  ])
}
