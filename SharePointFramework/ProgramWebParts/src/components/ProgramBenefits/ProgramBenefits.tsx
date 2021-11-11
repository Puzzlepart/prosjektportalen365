import React, {FunctionComponent, useEffect} from 'react'
import styles from './ProgramBenefits.module.scss'
import {IProgramBenefitsProps} from './ProgramBenefitsProps'
import {PortfolioAggregation} from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import { IAggregatedSearchListColumn } from 'pp365-portfoliowebparts/lib/interfaces'
import { Benefit, BenefitMeasurement, BenefitMeasurementIndicator } from 'pp365-portfoliowebparts/lib/models'
import {CONTENT_TYPE_ID_BENEFITS, CONTENT_TYPE_ID_MEASUREMENTS, CONTENT_TYPE_ID_INDICATORS} from 'pp365-portfoliowebparts/lib/components/BenefitsOverview/config'

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
      dataSource="Gevinstoversikt"
      columns={columns}
      selectProperties={proper}
      postTransform={_postTransform}
      />
      </>
    );
  
}

 function _postTransform(results: any[]): any[] {
   const benefits = results
     .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_BENEFITS) === 0)
     .map((res) => new Benefit(res))
   const measurements = results
     .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_MEASUREMENTS) === 0)
     .map((res) => new BenefitMeasurement(res))
     .sort((a, b) => b.Date.getTime() - a.Date.getTime())
   const indicactors = results
     .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_INDICATORS) === 0)
     .map((res) => {
       const indicator = new BenefitMeasurementIndicator(res)
         .setMeasurements(measurements)
         .setBenefit(benefits)
       return indicator
     })
     .filter((i) => i.Benefit)
   return indicactors
 }

const proper = ["Path","SPWebURL","Title","ListItemId","SiteTitle","SiteId","ContentTypeID","GtDesiredValueOWSNMBR","GtMeasureIndicatorOWSTEXT","GtMeasurementUnitOWSCHCS", "GtStartValueOWSNMBR", "GtMeasurementValueOWSNMBR", "GtMeasurementCommentOWSMTXT", "GtMeasurementDateOWSDATE", "GtGainsResponsibleOWSUSER", "GtGainsTurnoverOWSMTXT", "GtGainsTypeOWSCHCS", "GtPrereqProfitAchievementOWSMTXT", "GtRealizationTimeOWSDATE", "GtGainLookupId", "GtMeasureIndicatorLookupId", "GtGainsResponsible", "GtGainsOwner", "Path", "SPWebURL", "SiteTitle"]


  const columns: IAggregatedSearchListColumn[] = [
    {
      key: 'Benefit.Title',
      fieldName: 'Benefit.Title',
      name: "Gevinst",
      minWidth: 100,
      maxWidth: 180,
      isMultiline: true,
      isResizable: true
    },
    {
      key: 'Benefit.Responsible',
      fieldName: 'Benefit.Responsible',
      name: "Gevinstansvarlig",
      minWidth: 50,
      maxWidth: 150,
      isResizable: true,
      isGroupable: true
    },
    {
      key: 'Benefit.Owner',
      fieldName: 'Benefit.Owner',
      name: "Gevinsteier",
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
