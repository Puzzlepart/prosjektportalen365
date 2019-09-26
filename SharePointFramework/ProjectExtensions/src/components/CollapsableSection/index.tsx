import * as React from 'react';
import styles from './CollapsableSection.module.scss';
import { ICollapsableSectionProps } from './ICollapsableSectionProps';
import { ICollapsableSectionState } from './ICollapsableSectionState';
import { Icon } from 'office-ui-fabric-react/lib/Icon';


export class CollapsableSection extends React.Component<ICollapsableSectionProps, ICollapsableSectionState> {
    /**
     * Constructor
     * 
     * @param {ICollapsableSectionProps} props Props
     */
    constructor(props: ICollapsableSectionProps) {
        super(props);
        this.state = { isCollapsed: true };
    }

    /**
     * Renders the <CollapsableSection /> component
     */
    public render(): React.ReactElement<ICollapsableSectionProps> {
        const { isCollapsed } = this.state;

        return (
            <div className={`${this.props.className} ${styles.collapsableSection}`} hidden={this.props.hidden}>
                <div className={styles.title} onClick={this.onToggleExpandState} style={{ position: 'relative' }}>
                    <span>{this.props.title}</span>
                    <span style={{ position: 'absolute', right: 0 }}>
                        <Icon iconName={isCollapsed ? 'ChevronDown' : 'ChevronUp'} />
                    </span>
                </div>
                <div className={this.props.contentClassName} hidden={this.state.isCollapsed}>
                    {this.props.children}
                </div>
            </div>
        );
    }

    /**
     * On toggle expand state
     */
    public onToggleExpandState = () => {
        this.setState((prevState: ICollapsableSectionState) => ({ isCollapsed: !prevState.isCollapsed }));
    }
}
