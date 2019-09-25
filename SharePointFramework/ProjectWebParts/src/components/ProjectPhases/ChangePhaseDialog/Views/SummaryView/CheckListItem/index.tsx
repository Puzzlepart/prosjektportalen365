import { stringIsNullOrEmpty } from '@pnp/common';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import IChecklistItemProps from './IChecklistItemProps';
import IChecklistItemState from './IChecklistItemState';
import styles from './CheckListItem.module.scss';

const STATUS_COLORS = {
    [strings.StatusOpen]: 'inherit',
    [strings.StatusClosed]: '#107c10',
    [strings.StatusNotRelevant]: '#e81123',
};

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
        this.state = {};
    }

    public render(): JSX.Element {
        return (
            <li className={styles.checkListItem}>
                <div className='ms-Grid' dir='ltr'>
                    <div className='ms-Grid-row' style={this._style} onClick={this._onTitleClick.bind(this)}>
                        <div className='ms-Grid-col ms-sm10'>
                            <span>{this.props.item.ID}. {this.props.item.Title}</span>
                        </div>
                        <div className='ms-Grid-col ms-sm2' hidden={!this._hasComment}>
                            <Icon iconName={this.state.showComment ? 'ChevronDown' : 'ChevronUp'} />
                        </div>
                    </div>
                    <div className='ms-Grid-row' hidden={!this.state.showComment}>
                        <div className='ms-Grid-col ms-sm12'>
                            <p className='ms-metadata'>
                                {this.props.item.GtComment}
                            </p>
                        </div>
                    </div>
                </div>
            </li>
        );
    }

    private get _hasComment(): boolean {
        return !stringIsNullOrEmpty(this.props.item.GtComment);
    }

    private get _style() {
        return {
            color: STATUS_COLORS[this.props.item.GtChecklistStatus],
            cursor: this._hasComment ? 'pointer' : 'initial',
        };
    }

    private _onTitleClick() {
        if (this._hasComment) {
            this.setState(prevState => ({ showComment: !prevState.showComment }));
        }
    }
}



