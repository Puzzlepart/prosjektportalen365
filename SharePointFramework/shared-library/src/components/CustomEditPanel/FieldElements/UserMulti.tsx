import { IPersonaProps, NormalPeoplePicker } from '@fluentui/react'
import React from 'react'
import { FieldContainer } from '../../FieldContainer'
import styles from '../CustomEditPanel.module.scss'
import { useCustomEditPanelContext } from '../context'
import { FieldElementComponent } from './types'

export const UserMulti: FieldElementComponent = ({ field }) => {
    const context = useCustomEditPanelContext()
    return (
        <FieldContainer iconName='People' label={field.displayName} description={field.description}>
            <NormalPeoplePicker
                styles={{ text: styles.field }}
                onResolveSuggestions={async (filter, selectedItems) =>
                    (await context.props.dataAdapter.clientPeoplePickerSearchUser(
                        filter,
                        selectedItems
                    )) as IPersonaProps[]
                }
                defaultSelectedItems={context.model.get<IPersonaProps[]>(field)}
                itemLimit={20}
                onChange={(items) => context.model.set(field, items)}
            />
        </FieldContainer>
    )
}