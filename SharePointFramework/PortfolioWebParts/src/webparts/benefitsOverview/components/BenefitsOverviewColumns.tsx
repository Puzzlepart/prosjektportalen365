import * as React from 'react';
import * as strings from 'BenefitsOverviewWebPartStrings';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import BenefitMeasurementsModal from './BenefitMeasurementsModal';
import { IBenefitsOverviewProps } from './IBenefitsOverviewProps';
import getObjectValue from 'prosjektportalen-spfx-shared/lib/helpers/getObjectValue';
import { BenefitMeasurementIndicator } from '../models';
import BenefitMeasurementAchievement from './BenefitMeasurementAchievement';

export function GetColumns(props: IBenefitsOverviewProps): IColumn[] {
  let columns: IColumn[] = [
    {
      key: 'siteTitle',
      fieldName: 'siteTitle',
      name: PortfolioWebPartsStrings.SiteTitleLabel,
      minWidth: 100,
      maxWidth: 180,
      isResizable: true,
      onRender: (indicator: BenefitMeasurementIndicator) => {
        const webUrl = getObjectValue<string>(indicator, "webUrl", null);
        const siteTitle = getObjectValue<string>(indicator, "siteTitle", null);
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
      onRender: (indicator: BenefitMeasurementIndicator, _index: number, _column: IColumn) => {
        const measurement = getObjectValue(indicator, "measurements[0]", null);
        if (measurement) {
          return <BenefitMeasurementAchievement measurement={measurement} />;
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
      onRender: (indicator: BenefitMeasurementIndicator) => <BenefitMeasurementsModal indicator={indicator} />,
    },
  ];
  return columns.filter(col => getObjectValue<string[]>(props, 'hiddenColumns', []).indexOf(col.key) === -1);
}