import { Combobox, Option, Persona } from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { FieldContainer } from 'pp365-shared-library'
import React, { FC, useEffect, useState } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../../../../riskAction/context'
import { IResponsibleFieldProps } from './types'
import { format } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/core'

export const ResponsibleField: FC<IResponsibleFieldProps> = (props) => {
  const context = useRiskActionFieldCustomizerContext()
  const [value, setValue] = useState('')
  const [matchingUsers, setMatchingUsers] = useState([])

  useEffect(() => {
    context.dataAdapter
      .clientPeoplePickerSearchUser(value, [])
      .then((users) => setMatchingUsers(users))
  }, [value])

  return (
    <FieldContainer label={strings.ResponsibleFieldLabel} iconName='Person'>
      <Combobox
        freeform
        value={value}
        onOptionSelect={(_e, data) => {
          setValue(data.optionText)
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
        {!stringIsNullOrEmpty(value) && matchingUsers.length === 0 && (
          <Option key='ResponsibleFieldNoResults' text=''>
            {format(strings.ResponsibleFieldNoResults, value)}
          </Option>
        )}
      </Combobox>
    </FieldContainer>
  )
}

ResponsibleField.displayName = 'ResponsibleField'
ResponsibleField.defaultProps = {
  onChange: () => {
    // Empty function as default
  }
}
