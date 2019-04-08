import * as React from 'react';
import * as strings from 'BenefitsOverviewWebPartStrings';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { Icon, IIconProps } from 'office-ui-fabric-react/lib/Icon';
import BenefitMeasurementsModal from './BenefitMeasurementsModal';
import { IBenefitsOverviewProps } from './IBenefitsOverviewProps';
import getObjectValue from 'prosjektportalen-spfx-shared/lib/helpers/getObjectValue';
import { BenefitMeasurementIndicator } from '../models';

export function GetColumns(props: IBenefitsOverviewProps): IColumn[] {
  let columns: IColumn[] = [
    {
      key: 'siteTitle',
      fieldName: 'siteTitle',
      name: PortfolioWebPartsStrings.SiteTitleLabel,
      minWidth: 100,
      maxWidth: 180,
      isResizable: true,
      onRender: (item: BenefitMeasurementIndicator) => {
        const webUrl = getObjectValue<string>(item, "webUrl", null);
        const siteTitle = getObjectValue<string>(item, "siteTitle", null);
        return <a href={webUrl} target='_blank'>{siteTitle}</a>;
      },
      data: { isGroupable: true },
    },
    {
      key: 'benefit.title',
      fieldName: 'benefit.title',
      name: strings.BenefitTitleLabel,
      minWidth: 100,
      maxWidth: 180,
      isMultiline: true,
      isResizable: true,
      data: { isGroupable: true },
    },
    {
      key: 'benefit.responsible',
      fieldName: 'benefit.responsible',
      name: strings.BenefitResponsibleLabel,
      minWidth: 50,
      maxWidth: 180,
      isResizable: true,
      data: { isGroupable: true },
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
        const colValue = getObjectValue(item, "measurements[0].achievementDisplay", null);
        const trendIconProps = getObjectValue<IIconProps>(item, "measurements[0].trendIconProps", null);
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
  return columns.filter(col => getObjectValue<string[]>(props, 'hiddenColumns', []).indexOf(col.key) === -1);
}