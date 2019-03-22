import * as React from 'react';
import * as strings from 'BenefitsOverviewWebPartStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { BenefitMeasurementIndicator } from 'prosjektportalen-spfx-shared/lib/models';
import BenefitMeasurementsModal from './BenefitMeasurementsModal';
import * as objectGet from 'object-get';

export const BenefitsOverviewColumns: IColumn[] = [
  {
    key: 'siteTitle',
    fieldName: 'siteTitle',
    name: strings.SiteTitleLabel,
    minWidth: 100,
    maxWidth: 180,
    isResizable: true,
    onRender: (item: BenefitMeasurementIndicator) => {
      const webUrl = objectGet(item, "webUrl");
      const siteTitle = objectGet(item, "siteTitle");
      return <a href={webUrl} target='_blank'>{siteTitle}</a>;
    },
  },
  {
    key: 'benefit.title',
    fieldName: 'benefit.title',
    name: strings.BenefitTitleLabel,
    minWidth: 100,
    maxWidth: 180,
    isMultiline: true,
    isResizable: true,
  },
  {
    key: 'benefit.responsible',
    fieldName: 'benefit.responsible',
    name: strings.BenefitResponsibleLabel,
    minWidth: 50,
    maxWidth: 180,
    isResizable: true,
  },
  {
    key: 'title',
    fieldName: 'title',
    name: strings.TitleLabel,
    minWidth: 50,
    maxWidth: 180,
    isMultiline: true,
    isResizable: true,
  },
  {
    key: 'indicator',
    fieldName: 'indicator',
    name: strings.IndicatorLabel,
    minWidth: 50,
    maxWidth: 80,
    isResizable: true,
  },
  {
    key: 'unit',
    fieldName: 'unit',
    name: strings.UnitLabel,
    minWidth: 50,
    maxWidth: 80,
    isResizable: true,
  },
  {
    key: 'startValue',
    fieldName: 'startValue',
    name: strings.StartValueLabel,
    minWidth: 50,
    maxWidth: 80,
    isResizable: true,
    data: { fieldNameDisplay: 'startValueDisplay' },
  },
  {
    key: 'desiredValue',
    fieldName: 'desiredValue',
    name: strings.DesiredValueLabel,
    minWidth: 50,
    maxWidth: 80,
    isResizable: true,
    data: { fieldNameDisplay: 'desiredValueDisplay' },
  },
  {
    key: 'measurements[0].value',
    fieldName: 'measurements[0].value',
    name: strings.LastMeasurementLabel,
    minWidth: 50,
    maxWidth: 80,
    isResizable: true,
    data: { fieldNameDisplay: 'measurements[0].valueDisplay' }
  },
  {
    key: 'measurements[0].achievement',
    fieldName: 'measurements[0].achievement',
    name: strings.MeasurementAchievementLabel,
    minWidth: 50,
    maxWidth: 80,
    isResizable: true,
    onRender: (item: BenefitMeasurementIndicator, _index: number, _column: IColumn) => {
      const colValue = objectGet(item, "measurements[0].achievementDisplay");
      const trendIconProps = objectGet(item, "measurements[0].trendIconProps");
      if (colValue) {
        return (
          <span>
            <span style={{ display: "inline-block", width: 20 }}>{trendIconProps && <Icon {...trendIconProps} />}</span>
            <span>{colValue}</span>
          </span>
        );
      }
      return null;
    }
  },
  {
    fieldName: "allMeasurements",
    key: "allMeasurements",
    name: "",
    minWidth: 50,
    maxWidth: 80,
    onRender: (item: BenefitMeasurementIndicator) => <BenefitMeasurementsModal indicator={item} />,
  },
];