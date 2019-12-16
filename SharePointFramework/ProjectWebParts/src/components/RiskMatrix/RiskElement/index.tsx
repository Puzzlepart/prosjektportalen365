import * as React from 'react';
import styles from './RiskElement.module.scss';
import { IRiskElementProps } from './IRiskElementProps';

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
            style={style}>
            {model.id}
        </div>
    );
};