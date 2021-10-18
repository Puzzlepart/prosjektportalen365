import { Persona, PersonaPresence, PersonaSize } from 'office-ui-fabric-react/lib/Persona'
import React, { FunctionComponent } from 'react'
import { SearchValueType } from 'types'
import { IRenderItemColumnProps } from '../IRenderItemColumnProps'

export const UserColumn: FunctionComponent<IRenderItemColumnProps> = ({ columnValue, column }) => {
  if (column.searchType === SearchValueType.OWSUSER) {
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
  if (columnValue?.indexOf(';') !== -1) {
    return (
      <span>
        {columnValue.split(';').map((value, key) =>
          <span key={key}>
            <Persona
              styles={{ root: { marginTop: 4 } }}
              text={value}
              size={PersonaSize.size24}
              presence={PersonaPresence.none}
            />
          </span>
        )}
      </span>
    )
  }
  return (
    <span>
      <Persona
        text={columnValue}
        size={PersonaSize.size24}
        presence={PersonaPresence.none}
      />
    </span>
  )
}