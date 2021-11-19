import { DataAdapter } from "data";
import { IAggregatedPortfolioPropertyPane } from "./PropertyPanes";

export interface IAggregatedPortfolioProps {
    title: string
    context: any
    dataAdapter: DataAdapter
    properties: IAggregatedPortfolioPropertyPane
    updateProperty: (key: string, value: any) => void
  }


export interface AggreationColumn {
  key: string
  fieldName: string
  name: string
  minWidth:number
  maxWidth:number
  isMultiline:boolean
  isResizable:boolean
}
