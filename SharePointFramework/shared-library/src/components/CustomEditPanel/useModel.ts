import { IPersonaProps, ITag } from '@fluentui/react'
import _ from 'lodash'
import { ITermInfo } from '@pnp/sp/taxonomy';
import { useState } from 'react'
import { EditableSPField } from '../../models'
import { DefaultCaching } from '../../data/cache'
import { ICustomEditPanelProps } from './types'

/**
 * Hook for the `CustomEditPanel` model. This hook is used to get and set the values for
 * the fields in the `CustomEditPanel`, as well as to transform the values to the correct type
 * for the `property` object that can be sent as a request body to the API.
 *
 * @param props - The `CustomEditPanel` props.
 */
export function useModel(props: ICustomEditPanelProps) {
  const [model, setModel] = useState(new Map<string, any>())
  const [properties, setProperties] = useState<Record<string, any>>({})

  /**
   * Get value for field.
   *
   * @param field Field to get value for
   * @param fallbackValue Value to return if the field has no value
   */
  function get<T>(field: EditableSPField, fallbackValue: T = null): T {
    const currentValue = model.get(field.internalName)
    const $field = field.clone().setValue(props.fieldValues, currentValue)
    if ($field.isEmpty || !!currentValue) {
      return currentValue ?? (fallbackValue as unknown as T)
    }
    return $field.getParsedValue<any>()
  }

  /**
   * Transform value for the field returning the internal name of the field and the transformed value.
   *
   * @param value Value to be transformed
   * @param field Field to transform the value for
   *
   * @returns The transformed value and the internal name of the field (might be different from the field's internal name)
   */
  const transformValue = async (value: any, field: EditableSPField) => {
    const targetList = props.dataAdapter.sp.web.lists.getById(props.targetistId)
    const valueMap = new Map<string, () => Promise<any[]> | any[]>([
      [
        'URL',
        () => [
          {
            Description: value.description,
            Url: value.url
          }
        ]
      ],
      [
        'TaxonomyFieldTypeMulti',
        async () => {
          const textField = await targetList.fields
            .getById(field.getProperty('TextField'))
            .select('InternalName')
            .using(DefaultCaching)()

          const languageTag = props.dataAdapter.spfxContext.pageContext.cultureInfo.currentUICultureName || 'nb-NO'
          return [
            (value as ITermInfo[]).map((v) => {
              const label = v.labels.find(l => l.languageTag === languageTag)
              return `-1;#${label?.name}|${v.id}`
            }).join(';#'),
            textField.InternalName
          ]
        }
      ],
      [
        'TaxonomyFieldType',
        async () => {
          const textField = await targetList.fields
            .getById(field.getProperty('TextField'))
            .select('InternalName')
            .using(DefaultCaching)()

          const languageTag = props.dataAdapter.spfxContext.pageContext.cultureInfo.currentUICultureName || 'nb-NO'
          return [
            (value as ITermInfo[]).map((v) => {
              const label = v.labels.find(l => l.languageTag === languageTag)
              return `-1;#${label?.name}|${v.id}`
            }).join(';#'),
            textField.InternalName
          ]
        }
      ],
      [
        'User',
        async () => {
          const email = value[0]?.secondaryText
          let val = null
          if (email) val = (await props.dataAdapter.sp.web.ensureUser(email)).data.Id
          return [val, `${field.internalName}Id`]
        }
      ],
      [
        'UserMulti',
        async () => {
          const values = await Promise.all(
            value.map(
              async (v: IPersonaProps) =>
                (
                  await props.dataAdapter.sp.web.ensureUser(v.secondaryText)
                ).data.Id
            )
          )
          return [_.flatten(values), `${field.internalName}Id`]
        }
      ],
      [
        'Lookup',
        () => {
          return [value, `${field.internalName}Id`]
        }
      ]
    ])
    if (valueMap.has(field.type)) {
      const [transformedValue, internalName] = await valueMap.get(field.type)()
      return [internalName ?? field.internalName, transformedValue]
    }
    return [field.internalName, value]
  }

  /**
   * Set value for field.
   *
   * @param field Field to set value for
   * @param value Value to set (will be transformed to the correct type for the field)
   */
  const set = async <T>(field: EditableSPField, value: T) => {
    const [internalName, transformedValue] = await transformValue(value, field)
    model.set(field.internalName, value)
    setModel(new Map(model))
    setProperties({ ...properties, [internalName]: transformedValue })
  }

  /**
   * Returns `true` if any of the fields have been changed.
   */
  const isChanged = model.size > 0

  /**
   * Reset the model and properties.
   */
  const reset = () => {
    setModel(new Map())
    setProperties({})
  }

  return { model, set, get, properties, isChanged, reset }
}

export type UseModelReturnType = ReturnType<typeof useModel>
