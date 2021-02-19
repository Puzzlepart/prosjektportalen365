import { Persona, PersonaPresence, PersonaSize } from 'office-ui-fabric-react/lib/Persona'
import React, { Component, ReactElement } from 'react'
import { SearchValueType } from 'types'
import { IRenderItemColumnProps } from '../IRenderItemColumnProps'

export class UserColumn extends Component<IRenderItemColumnProps> {
  public render(): ReactElement<IRenderItemColumnProps> {
    if (this.props.column.searchType === SearchValueType.OWSUSER) {
      const [email, text] = this.props.columnValue.split(' | ')
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
        <Persona
          text={this.props.columnValue}
          size={PersonaSize.size24}
          presence={PersonaPresence.none}
        />
      </span>
    )
  }
}
