import * as React from 'react'
import { Persona, PersonaPresence, PersonaSize } from 'office-ui-fabric-react/lib/Persona'
import { IRenderItemColumnProps } from '../IRenderItemColumnProps'
import { SearchValueType } from 'types'

export class UserColumn extends React.Component<IRenderItemColumnProps> {
  public render(): React.ReactElement<IRenderItemColumnProps> {
    if (this.props.column.searchType === SearchValueType.OWSUSER) {
      const [email, text] = this.props.colValue.split(' | ')
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
          text={this.props.colValue}
          size={PersonaSize.size24}
          presence={PersonaPresence.none}
        />
      </span>
    )
  }
}
