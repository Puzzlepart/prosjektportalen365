import { Combobox, Field, Option, Persona } from '@fluentui/react-components'
import React, { FC, useContext, useEffect, useState } from 'react'
import { RiskActionFieldCustomizerContext } from '../../../../context'

export const ResposibleField: FC<any> = () => {
  const context = useContext(RiskActionFieldCustomizerContext)
  const [value, setValue] = useState('')
  const [matchingUsers, setMatchingUsers] = useState([])

  useEffect(() => {
    context.dataAdapter
      .clientPeoplePickerSearchUser(value, [])
      .then((users) => setMatchingUsers(users))
  }, [value])

  return (
    <Field label='Ansvarlig'>
      <Combobox
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
            Ingen brukere funnet.
          </Option>
        ) : null}
      </Combobox>
    </Field>
  )
}
