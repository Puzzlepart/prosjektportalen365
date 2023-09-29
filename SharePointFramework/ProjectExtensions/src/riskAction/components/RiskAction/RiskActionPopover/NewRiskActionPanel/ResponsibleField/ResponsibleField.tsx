import { Combobox, Field, Option, Persona } from '@fluentui/react-components'
import React, { FC, useContext, useEffect, useState } from 'react'
import { RiskActionFieldCustomizerContext } from '../../../../../context'
import { IResponsibleFieldProps } from './types'
import strings from 'ProjectExtensionsStrings'

export const ResponsibleField: FC<IResponsibleFieldProps> = (props) => {
    const context = useContext(RiskActionFieldCustomizerContext)
    const [value, setValue] = useState('')
    const [matchingUsers, setMatchingUsers] = useState([])

    useEffect(() => {
        context.dataAdapter
            .clientPeoplePickerSearchUser(value, [])
            .then((users) => setMatchingUsers(users))
    }, [value])

    return (
        <Field label={strings.ResponsibleFieldLabel}>
            <Combobox
                onOptionSelect={(_e, data) => {
                    props.onChange(data.optionValue)
                }}
                onChange={(e) => {
                    setValue(e.target.value)
                }}
            >
                {matchingUsers.map((user, index) => (
                    <Option key={index} text={user.text} value={user.secondaryText}>
                        <Persona
                            avatar={{ color: 'colorful', 'aria-hidden': true }}
                            name={user.text}
                            presence={{
                                status: 'unknown'
                            }}
                            secondaryText={user.secondaryText}
                        />
                    </Option>
                ))}
                {matchingUsers.length === 0 ? (
                    <Option key='no-results' text=''>
                        {strings.ResponsibleFieldNoResults}
                    </Option>
                ) : null}
            </Combobox>
        </Field>
    )
}

ResponsibleField.displayName = 'ResponsibleField'
ResponsibleField.defaultProps = {
    onChange: () => {}
}