import { Textarea } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

export const Note: FieldElementComponent = ({ field }) => {
    const context = useCustomEditPanelContext()
    return (
        <FieldContainer
            iconName='TextAlignLeft'
            label={field.displayName}
            description={field.description}
        >
            <Textarea
                defaultValue={context.model.get<string>(field)}
                onChange={(_, data) => context.model.set(field, data.value)}
                placeholder={strings.Placeholder.TextField}
            />
        </FieldContainer>
    )
}