import * as React from 'react';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import IChecklistItemProps from './IChecklistItemProps';
import IChecklistItemState from './IChecklistItemState';
import * as strings from 'ProjectWebPartsStrings';
import { stringIsNullOrEmpty } from '@pnp/common';

function getStatusColor(status: string): string {
    switch (status) {
        case strings.StatusOpen: {
            return 'inherit';
        }
        case strings.StatusClosed: {
            return '#107c10';
        }
        case strings.StatusNotRelevant: {
            return '#e81123';
        }
        default: {
            return '';
        }
    }
}

/**
 * @component CheckListItem
 */
export default class CheckListItem extends React.PureComponent<IChecklistItemProps, IChecklistItemState> {
    /**
     * Constructor
     *
     * @param {IChecklistItemProps} props Props
     */
    constructor(props: IChecklistItemProps) {
        super(props);
        this.state = { showComment: false };
    }

    public render(): JSX.Element {
        const hasComment = !stringIsNullOrEmpty(this.props.checkListItem.GtComment);
        const style = { color: getStatusColor(this.props.checkListItem.GtChecklistStatus), cursor: hasComment ? 'pointer' : 'initial' };
        return (
            <li>
                <div className='ms-Grid' style={style} dir='ltr'>
                    <div className='ms-Grid-row' onClick={() => {
                        if (hasComment) {
                            this.setState({ showComment: !this.state.showComment });
                        }
                    }}>
                        <div className='ms-Grid-col ms-sm10'>
                            <span>{this.props.checkListItem.Title}</span>
                        </div>
                        <div className='ms-Grid-col ms-sm2' hidden={!hasComment}>
                            <Icon iconName={this.state.showComment ? 'ChevronDown' : 'ChevronUp'} />
                        </div>
                    </div>
                    <div className='ms-Grid-row' hidden={!this.state.showComment}>
                        <div className='ms-Grid-col ms-sm12'>
                            <p className='ms-metadata'>
                                {this.props.checkListItem.GtComment}
                            </p>
                        </div>
                    </div>
                </div>
            </li>
        );
    }
}



