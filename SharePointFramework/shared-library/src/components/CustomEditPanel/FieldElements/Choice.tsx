import { Combobox, Option } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React from 'react'
import { FieldContainer } from '../../FieldContainer'
import { useCustomEditPanelContext } from '../context'
import { FieldElementComponent } from './types'

export const Choice: FieldElementComponent = ({ field }) => {
    const context = useCustomEditPanelContext()
    return (
        <FieldContainer
            iconName='MultiselectLtr'
            label={field.displayName}
            description={field.description}
        >
            <Combobox
                value={context.model.get<string>(field)}
                defaultSelectedOptions={[context.model.get<string>(field)]}
                placeholder={strings.Placeholder.ChoiceField}
                onOptionSelect={(_, data) => context.model.set(field, data.optionValue)}
            >
                {field.choices.map((choice) => (
                    <Option key={choice}>{choice}</Option>
                ))}
            </Combobox>
        </FieldContainer>
    )
}