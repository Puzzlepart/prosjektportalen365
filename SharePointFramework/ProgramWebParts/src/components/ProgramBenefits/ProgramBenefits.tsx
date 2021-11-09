import React, {FunctionComponent, useEffect} from 'react'
import styles from './ProgramBenefits.module.scss'
import {IProgramBenefitsProps} from './ProgramBenefitsProps'
import {PortfolioAggregation} from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import {getColumns} from 'pp365-portfoliowebparts/lib/components/BenefitsOverview/columns'
import { IAggregatedSearchListColumn } from 'pp365-portfoliowebparts/lib/interfaces'

export const ProgramBenefits: FunctionComponent<IProgramBenefitsProps> = (props) => {

  useEffect(() => {    

  }, []);

    return (
      <>
      <PortfolioAggregation 
      title={"Gevinstoversikt"}
      pageContext={props.context.pageContext}
      dataAdapter={props.dataAdapter}
      showCommandBar={true}
      showExcelExportButton={true}
      dataSource="Gevinstoversikt (Prosjektnivå)"
      columns={columns}
      selectProperties={proper}

      // childSiteIds={props.childProjects}
      />
      </>
    );
  
}
const proper = ["Path","SPWebURL","Title","ListItemId","SiteTitle","SiteId","ContentTypeID","GtDesiredValueOWSNMBR","GtMeasureIndicatorOWSTEXT","GtMeasurementUnitOWSCHCS", "GtStartValueOWSNMBR", "GtMeasurementValueOWSNMBR", "GtMeasurementCommentOWSMTXT", "GtMeasurementDateOWSDATE", "GtGainsResponsibleOWSUSER", "GtGainsTurnoverOWSMTXT", "GtGainsTypeOWSCHCS", "GtPrereqProfitAchievementOWSMTXT", "GtRealizationTimeOWSDATE", "GtGainLookupId", "GtMeasureIndicatorLookupId", "GtGainsResponsible", "GtGainsOwner", "Path", "SPWebURL", "SiteTitle"]


  const columns: IAggregatedSearchListColumn[] = [
    {
      key: 'Benefit.Title',
      fieldName: 'Benefit.Title',
      name: "Benefit.Title",
      minWidth: 100,
      maxWidth: 180,
      isMultiline: true,
      isResizable: true
    },
    {
      key: 'Benefit.Responsible',
      fieldName: 'Benefit.Responsible',
      name: "Benefit.Responsible",
      minWidth: 50,
      maxWidth: 150,
      isResizable: true,
      isGroupable: true
    },
    {
      key: 'Benefit.Owner',
      fieldName: 'Benefit.Owner',
      name: "Benefit.Owner",
      minWidth: 50,
      maxWidth: 180,
      isResizable: true,
      isGroupable: true
    },
    {
      key: 'Title',
      fieldName: 'Title',
      name: "Title",
      minWidth: 50,
      maxWidth: 180,
      isMultiline: true,
      isResizable: true
    },
    {
      key: 'Unit',
      fieldName: 'Unit',
      name: "Unit",
      minWidth: 50,
      maxWidth: 80,
      isResizable: true
    }
  ]
