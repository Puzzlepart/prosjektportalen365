import { ITag, TagPicker } from '@fluentui/react'
import React from 'react'
import { FieldContainer } from '../../../FieldContainer'
import styles from '../CustomEditPanelBody.module.scss'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

export const TaxonomyFieldType: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  return (
    <FieldContainer iconName='AppsList' label={field.displayName} description={field.description} required={field.required}>
      <TagPicker
        styles={{ text: styles.field }}
        onResolveSuggestions={async (filter, selectedItems) =>
          await context.props.dataAdapter.getTerms(
            field.getProperty('TermSetId'),
            filter,
            selectedItems
          )
        }
        onEmptyResolveSuggestions={async (selectedItems) =>
          await context.props.dataAdapter.getTerms(
            field.getProperty('TermSetId'),
            '',
            selectedItems
          )
        }
        defaultSelectedItems={context.model.get<ITag[]>(field)}
        itemLimit={1}
        onChange={(items) => context.model.set(field, items)}
      />
    </FieldContainer>
  )
}
