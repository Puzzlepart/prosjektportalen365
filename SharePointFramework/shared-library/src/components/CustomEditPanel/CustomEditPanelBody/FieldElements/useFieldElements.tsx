import React from 'react'
import { EditableSPField } from '../../../../models'
import { Boolean } from './Boolean'
import { Choice } from './Choice'
import { DateTime } from './DateTime'
import { Lookup } from './Lookup'
import { MultiChoice } from './MultiChoice'
import { Note } from './Note'
import { TaxonomyFieldType } from './TaxonomyFieldType'
import { TaxonomyFieldTypeMulti } from './TaxonomyFieldTypeMulti'
import { Text } from './Text'
import { URL } from './URL'
import { User } from './User'
import { UserMulti } from './UserMulti'
import { Currency } from './Currency'

/**
 * Hook for field elements of `CustomEditPanel` component. This hook is used to render field elements
 * based on field type. Supported field types are:
 *
 * - `Boolean`
 * - `URL`
 * - `Text`
 * - `Note`
 * - `DateTime`
 * - `Choice`
 * - `MultiChoice`
 * - `User`
 * - `UserMulti`
 * - `TaxonomyFieldType`
 * - `TaxonomyFieldTypeMulti`
 * - `Lookup`
 * - `Currency`
 */
export function useFieldElements() {
  const fieldElements: Record<string, (field: EditableSPField) => JSX.Element> = {
    Boolean: (field) => <Boolean field={field} />,
    URL: (field) => <URL field={field} />,
    Text: (field) => <Text field={field} />,
    Note: (field) => <Note field={field} />,
    DateTime: (field) => <DateTime field={field} />,
    Choice: (field) => <Choice field={field} />,
    MultiChoice: (field) => <MultiChoice field={field} />,
    User: (field) => <User field={field} />,
    UserMulti: (field) => <UserMulti field={field} />,
    TaxonomyFieldType: (field) => <TaxonomyFieldType field={field} />,
    TaxonomyFieldTypeMulti: (field) => <TaxonomyFieldTypeMulti field={field} />,
    Lookup: (field) => <Lookup field={field} />,
    Currency: (field) => <Currency field={field} />
  }

  /**
   * Get element to render for the specified field.
   *
   * @param field Field to get element for
   */
  return (field: EditableSPField) => {
    return fieldElements[field.type] && fieldElements[field.type](field)
  }
}
