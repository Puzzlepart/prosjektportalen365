import * as React from 'react';
import { ICollapsableSectionProps } from './ICollapsableSectionProps';
import { ICollapsableSectionState } from './ICollapsableSectionState';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';

export default class CollapsableSection extends React.Component<ICollapsableSectionProps, ICollapsableSectionState> {
    constructor(props: ICollapsableSectionProps) {
        super(props);
        this.state = { isCollapsed: true };
    }

    public render(): React.ReactElement<ICollapsableSectionProps> {
        const { isCollapsed } = this.state;

        return (
            <div className={this.props.className}>
                <div className={this.props.titleClassName} onClick={this.onToggleExpandState} style={{ position: 'relative' }}>
                    <span>{this.props.title}</span>
                    <span style={{ position: 'absolute', right: 0 }}><Icon iconName={isCollapsed ? 'ChevronDown' : 'ChevronUp'} /></span>
                </div>
                <div className={this.props.contentClassName} hidden={this.state.isCollapsed}>
                    {this.props.children}
                </div>
            </div>
        );
    }

    @autobind
    public onToggleExpandState() {
        this.setState((prevState: ICollapsableSectionState) => ({ isCollapsed: !prevState.isCollapsed }));
    }
}
