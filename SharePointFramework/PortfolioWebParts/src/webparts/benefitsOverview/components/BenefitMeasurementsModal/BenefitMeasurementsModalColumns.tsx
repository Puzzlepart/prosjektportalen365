import * as React from 'react';
import * as strings from 'BenefitsOverviewWebPartStrings';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { BenefitMeasurementIndicator } from 'prosjektportalen-spfx-shared/lib/models';
import * as objectGet from 'object-get';

export const BenefitMeasurementsModalColumns = [
    {
        key: 'value',
        fieldName: 'value',
        name: strings.MeasurementValueLabel,
        minWidth: 100,
        maxWidth: 100,
        data: { fieldNameDisplay: 'valueDisplay' },
    },
    {
        key: 'achievement',
        fieldName: 'achievement',
        name: strings.MeasurementAchievementLabel,
        minWidth: 100,
        maxWidth: 100,
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