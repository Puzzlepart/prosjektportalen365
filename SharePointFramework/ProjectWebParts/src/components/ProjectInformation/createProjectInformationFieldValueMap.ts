import { IPersonaSharedProps } from '@fluentui/react'
import { ProjectInformationFieldValue } from './types'
import { ISPFieldUser } from 'pp365-shared-library/lib/interfaces'

/**
 * Create a field value map that can be used to parse the field value
 * from the SharePoint REST API.
 */
export const createProjectInformationFieldValueMap = <T>(): Map<
  string,
  (value: ProjectInformationFieldValue) => T
> => {
  const map = new Map<string, (value: ProjectInformationFieldValue) => T>()

  map.set('URL', ({ text }) => {
    const [url, description] = text.split(', ')
    return { url, description } as unknown as T
  })

  map.set(
    'TaxonomyFieldType',
    ({ text }) => text.split(';').map((v) => ({ key: v, name: v })) as unknown as T
  )

  map.set(
    'TaxonomyFieldTypeMulti',
    ({ text }) => text.split(';').map((v) => ({ key: v, name: v })) as unknown as T
  )

  map.set('DateTime', ({ $ }) => new Date($) as unknown as T)

  map.set('MultiChoice', ({ text }) => text.split(', ') as unknown as T)

  map.set('User', ({ $ }) => {
    const users = ([$].filter(Boolean) as ISPFieldUser[]).map<IPersonaSharedProps>((v) => ({
      key: v.Id,
      text: v.Title,
      secondaryText: v.EMail,
      imageUrl: `/_layouts/15/userphoto.aspx?size=L&username=${v.EMail}`
    }))
    return users as unknown as T
  })

  map.set('UserMulti', ({ $ = [] }) => {
    const users = ($ as ISPFieldUser[]).map<IPersonaSharedProps>((v) => ({
      key: v.Id,
      text: v.Title,
      secondaryText: v.EMail,
      imageUrl: `/_layouts/15/userphoto.aspx?size=L&username=${v.EMail}`
    }))
    return users as unknown as T
  })

  return map
}
