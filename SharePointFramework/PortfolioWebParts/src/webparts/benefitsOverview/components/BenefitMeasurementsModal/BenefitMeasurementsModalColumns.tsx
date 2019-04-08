import * as React from 'react';
import * as strings from 'BenefitsOverviewWebPartStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import * as objectGet from 'object-get';
import { BenefitMeasurementIndicator } from '../../models';

export const BenefitMeasurementsModalColumns: IColumn[] = [
    {
        key: 'value',
        fieldName: 'value',
        name: strings.MeasurementValueLabel,
        minWidth: 100,
        maxWidth: 100,
        data: { fieldNameDisplay: 'valueDisplay' },
        isResizable: true,
    },
    {
        key: 'comment',
        fieldName: 'comment',
        name: strings.MeasurementCommentLabel,
        minWidth: 100,
        maxWidth: 150,
        isMultiline: true,
        isResizable: true,
    },
    {
        key: 'achievement',
        fieldName: 'achievement',
        name: strings.MeasurementAchievementLabel,
        minWidth: 100,
        maxWidth: 100,
        isResizable: true,
        onRender: (item: BenefitMeasurementIndicator) => {
            const colValue = objectGet(item, 'achievementDisplay');
            const trendIconProps = objectGet(item, 'trendIconProps');
            if (colValue) {
                return (
                    <span>
                        <span style={{ display: 'inline-block', width: 20 }}>{trendIconProps && <Icon {...trendIconProps} />}</span>
                        <span>{colValue}</span>
                    </span>
                );
            }
            return null;
        },
    },
    {
        key: 'dateDisplay',
        fieldName: 'dateDisplay',
        name: strings.MeasurementDateLabel,
        minWidth: 150,
    },
];