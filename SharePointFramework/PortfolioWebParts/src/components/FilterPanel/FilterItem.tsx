import * as React from 'react';
import styles from './FilterItem.module.scss';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';

export interface IFilterItemProps {
    name: string;
    selected?: boolean;
    onChanged?: (event: React.FormEvent<HTMLElement | HTMLInputElement>, checked: boolean) => void;
}

export interface IFilterItemState { }

export class FilterItem extends React.Component<IFilterItemProps, IFilterItemState> {
    constructor(props: IFilterItemProps) {
        super(props);
        this.state = {};
    }

    public render(): React.ReactElement<IFilterItemProps> {
        return (
            <li>
                <div className={styles.filterItem}>
                    <Checkbox
                        label={this.props.name}
                        defaultChecked={this.props.selected}
                        onChange={this.props.onChanged} />
                </div>
            </li>
        );
    }
}
