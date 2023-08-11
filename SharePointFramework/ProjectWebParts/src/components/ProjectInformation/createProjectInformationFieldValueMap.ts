import { IPersonaSharedProps } from '@fluentui/react'
import { ProjectInformationFieldValue } from './types'
import { ISPFieldUser } from 'pp365-shared-library/lib/interfaces'

/**
 * Create a field value map that can be used to parse the field value
 * from the SharePoint REST API.
 */
export const createProjectInformationFieldValueMap = (): Map<
  string,
  (value: ProjectInformationFieldValue) => any
> => {
  const map = new Map<string, (value: ProjectInformationFieldValue) => any>()

  map.set('URL', ({ value }) => {
    const [url, description] = value.split(', ')
    return { url, description }
  })

  map.set('TaxonomyFieldType', ({ value }) => value.split(';').map((v) => ({ key: v, name: v })))

  map.set('TaxonomyFieldTypeMulti', ({ value }) =>
    value.split(';').map((v) => ({ key: v, name: v }))
  )

  map.set('DateTime', ({ $ }) => new Date($))

  map.set('MultiChoice', ({ value }) => (typeof value === 'string' ? value.split(', ') : value))

  map.set('User', ({ $ }) =>
    ([$].filter(Boolean) as ISPFieldUser[]).map<IPersonaSharedProps>((v) => ({
      key: v.Id,
      text: v.Title,
      secondaryText: v.EMail,
      imageUrl: `/_layouts/15/userphoto.aspx?size=L&username=${v.EMail}`
    }))
  )

  map.set('UserMulti', ({ $ = [] }) =>
    ($ as ISPFieldUser[]).map<IPersonaSharedProps>((v) => ({
      key: v.Id,
      text: v.Title,
      secondaryText: v.EMail,
      imageUrl: `/_layouts/15/userphoto.aspx?size=L&username=${v.EMail}`
    }))
  )

  return map
}
