import * as React from 'react';
import { IRenderItemColumnProps } from '../IRenderItemColumnProps';
import { Tag } from './Tag';

export class TagsColumn extends React.Component<IRenderItemColumnProps, {}> {
    public render(): React.ReactElement<IRenderItemColumnProps> {
        let tags: string[] = this.props.colValue.split(';');
        return (
            <span>
                {tags.map((text, idx) => <Tag key={idx} text={text} />)}
            </span>
        );
    }
}
