/**
 * Configuration for renaming and transforming measurement columns in Excel export.
 * Maps source field names to their display configuration.
 */
export interface MeasurementColumnConfig {
  [key: string]: {
    /**
     * Display name for the column.
     */
    name: string
    
    /**
     * Optional data type for special formatting (e.g., 'date').
     */
    dataType?: string
  }
}
