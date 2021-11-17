import React, { FunctionComponent, useEffect } from 'react'
import { IProgramBenefitsProps } from './ProgramRiskProps'
import { PortfolioAggregation } from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'

export const ProgramRiskOverview: FunctionComponent<IProgramBenefitsProps> = (props) => {

  useEffect(() => {

  }, []);

  return (
    <>
      <PortfolioAggregation
        title={"Risikooversikt"}
        pageContext={props.context.pageContext}
        dataAdapter={props.dataAdapter}
        showCommandBar={true}
        showExcelExportButton={true}
        dataSource="Programrisiko"
        columns={columns}
        selectProperties={proper}
      />
    </>
  );
}


const proper = ["Path", "SPWebURL", "Title", "ListItemId", "SiteTitle", "SiteId", "ContentTypeID", "GtRiskProbabilityOWSNMBR", "GtRiskProbabilityPostActionOWSNMBR", "GtRiskConsequenceOWSNMBR", "GtRiskConsequencePostActionOWSNMBR", "GtRiskActionOWSMTXT", "Path", "SPWebURL", "SiteTitle"]


const columns: any[] = [
  {
    key: "Title",
    fieldName: "Title",
    name: "Tittel",
    minWidth: 150,
    maxWidth: 300
  },
  {
    key: "GtRiskProbabilityOWSNMBR",
    fieldName: "GtRiskProbabilityOWSNMBR",
    name: "Sannsynlighet (S)",
    minWidth: 100,
    maxWidth: 125,
    data: {
      renderAs: "int"
    }
  },
  {
    key: "GtRiskConsequenceOWSNMBR",
    fieldName: "GtRiskConsequenceOWSNMBR",
    name: "Konsekvens (K)",
    minWidth: 100,
    maxWidth: 125,
    data: {
      renderAs: "int"
    }
  },
  {
    key: "GtRiskProbabilityPostActionOWSNMBR",
    fieldName: "GtRiskProbabilityPostActionOWSNMBR",
    name: "S etter tiltak",
    minWidth: 100,
    maxWidth: 125,
    data: {
      renderAs: "int"
    }
  },
  {
    key: "GtRiskConsequencePostActionOWSNMBR",
    fieldName: "GtRiskConsequencePostActionOWSNMBR",
    name: "K etter tiltak",
    minWidth: 100,
    maxWidth: 125,
    data: {
      renderAs: "int"
    }
  },
  {
    key: "GtRiskActionOWSMTXT",
    fieldName: "GtRiskActionOWSMTXT",
    name: "Tiltak",
    minWidth: 300,
    isMultiline: true
  }
]