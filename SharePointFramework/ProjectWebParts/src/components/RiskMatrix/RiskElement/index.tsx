import * as React from 'react';
import { RiskElementModel } from '../RiskElementModel';
import styles from './RiskElement.module.scss';

export interface IRiskElementProps extends React.HTMLProps<HTMLDivElement> {
    model: RiskElementModel;
}

// tslint:disable-next-line: naming-convention
export const RiskElement = ({ style, model }: IRiskElementProps) => {
    const getTooltip = () => {
        let tooltip = '';
        if (model.siteTitle) {
            tooltip += `${model.siteTitle}: `;
        }
        tooltip += model.title;
        return tooltip;
    };

    return (
        <div
            className={styles.riskElement}
            title={getTooltip()}
            style={style} >
        </div>
    );
};