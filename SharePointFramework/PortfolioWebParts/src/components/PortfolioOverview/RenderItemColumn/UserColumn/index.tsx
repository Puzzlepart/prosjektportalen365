import * as React from 'react';
import { Persona, PersonaPresence, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { IRenderItemColumnProps } from '../IRenderItemColumnProps';
import { SearchValueType } from 'types';

export class UserColumn extends React.Component<IRenderItemColumnProps, {}> {
    public render(): React.ReactElement<IRenderItemColumnProps> {
        if (this.props.column.searchType === SearchValueType.OWSUSER) {
            let [email, primaryText] = this.props.colValue.split(' | ');
            return (
                <span>
                    <Persona
                        primaryText={primaryText}
                        onRenderPrimaryText={props => (
                            <div>
                                <a href={`mailto:${email}`}>{props.primaryText}</a>
                            </div>
                        )}
                        size={PersonaSize.size24}
                        presence={PersonaPresence.none} />
                </span>
            );
        }
        return (
            <span>
                <Persona primaryText={this.props.colValue} size={PersonaSize.size24} presence={PersonaPresence.none} />
            </span>
        );
    }
}
