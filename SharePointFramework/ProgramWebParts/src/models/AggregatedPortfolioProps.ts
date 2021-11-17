import { DataAdapter } from "data";
import { IAggregatedPortfolioPropertyPane } from "./PropertyPanes";

export interface IAggregatedPortfolioProps {
    title: string
    context: any
    dataAdapter: DataAdapter
    properties: IAggregatedPortfolioPropertyPane
    updateProperty: (key: string, value: any) => void
  }