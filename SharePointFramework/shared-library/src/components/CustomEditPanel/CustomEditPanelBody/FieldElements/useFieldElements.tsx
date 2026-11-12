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
import { Number } from './Number'
import { Percentage } from './Percentage'

/**
 * Selects the edit control for each SharePoint field, including percentage-formatted numbers.
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
    Currency: (field) => <Currency field={field} />,
    Number: (field) => <Number field={field} />
  }

  return (field: EditableSPField) => {
    if (field.type === 'Number' && field.isPercentage) {
      return <Percentage field={field} />
    }
    return fieldElements[field.type] && fieldElements[field.type](field)
  }
}
