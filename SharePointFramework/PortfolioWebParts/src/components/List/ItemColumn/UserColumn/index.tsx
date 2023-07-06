import { Persona, PersonaPresence, PersonaSize } from '@fluentui/react/lib/Persona'
import React from 'react'
import { SearchValueType } from 'types'
import { ColumnRenderComponent, IRenderItemColumnProps } from '../types'
import strings from 'PortfolioWebPartsStrings'
import { registerColumnRenderComponent } from '../columnRenderComponentRegistry'

export const UserColumn: ColumnRenderComponent<IRenderItemColumnProps> = ({
  columnValue,
  column
}) => {
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
  if (
    column?.data?.searchType === SearchValueType.OWSUSER ||
    column.fieldName.indexOf('OWSUSER') !== -1
  ) {
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

UserColumn.key = 'user'
UserColumn.id = 'User'
UserColumn.displayName = strings.ColumnRenderOptionUser
UserColumn.iconName = 'Contact'
registerColumnRenderComponent(UserColumn)
