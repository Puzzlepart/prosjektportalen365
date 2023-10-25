import { IPersonaProps, NormalPeoplePicker } from '@fluentui/react'
import React from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import styles from '../CustomEditPanelBody.module.scss'
import { FieldElementComponent } from './types'

export const User: FieldElementComponent = ({ field }) => {
    const context = useCustomEditPanelContext()
    return (
        <FieldContainer iconName='Person' label={field.displayName} description={field.description}>
            <NormalPeoplePicker
                styles={{ text: styles.field }}
                onResolveSuggestions={async (filter, selectedItems) =>
                    (await context.props.dataAdapter.clientPeoplePickerSearchUser(
                        filter,
                        selectedItems
                    )) as IPersonaProps[]
                }
                defaultSelectedItems={context.model.get<IPersonaProps[]>(field)}
                itemLimit={1}
                onChange={(items) => context.model.set(field, items)}
            />
        </FieldContainer>
    )
}