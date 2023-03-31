import { useFilteredData } from '../useFilteredData'

export interface IPortfolioOverviewCommandsProps {
  /**
   * Filtered data returned by hook `useFilteredData` (passed as prop
   * to avoid persisting the filtered state in the state of the component)
   */
  filteredData: ReturnType<typeof useFilteredData>
}
