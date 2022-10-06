import { Persona, PersonaPresence, PersonaSize } from 'office-ui-fabric-react/lib/Persona'
import { ProjectColumn } from 'pp365-shared/lib/models'
import React, { FunctionComponent } from 'react'
import { SearchValueType } from 'types'
import { IRenderItemColumnProps } from '../IRenderItemColumnProps'

export const UserColumn: FunctionComponent<IRenderItemColumnProps> = ({ columnValue, column }) => {
  const isMultiUser = columnValue?.indexOf(';') !== -1
  if (isMultiUser) {
    return (
      <span>
        {columnValue?.split(';').map((value, key) => (
          <span key={key}>
            <Persona
              styles={{ root: { marginTop: 4 } }}
              text={value}
              size={PersonaSize.size24}
              presence={PersonaPresence.none}
            />
          </span>
        ))}
      </span>
    )
  }
  if ((column as ProjectColumn)?.searchType === SearchValueType.OWSUSER || column.fieldName.indexOf('OWSUSER') !== -1) {
    const [email, text] = columnValue.split(' | ')
    return (
      <span>
        <Persona
          text={text}
          onRenderPrimaryText={(props) => (
            <div>
              <a href={`mailto:${email}`}>{props.text}</a>
            </div>
          )}
          size={PersonaSize.size24}
          presence={PersonaPresence.none}
        />
      </span>
    )
  }
  return (
    <span>
      <Persona text={columnValue} size={PersonaSize.size24} presence={PersonaPresence.none} />
    </span>
  )
}
