import * as React from 'react';
import * as strings from 'BenefitsOverviewWebPartStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { BenefitMeasurement } from 'models';
import BenefitMeasurementAchievement from '../BenefitMeasurementAchievement';

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
        minWidth: 175,
        maxWidth: 175,
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
        onRender: (measurement: BenefitMeasurement) => <BenefitMeasurementAchievement measurement={measurement} />,
    },
    {
        key: 'dateDisplay',
        fieldName: 'dateDisplay',
        name: strings.MeasurementDateLabel,
        minWidth: 150,
    },
];