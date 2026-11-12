import * as strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'

/**
 * A column form field's description, which says when the field cannot change: for a column that
 * exists (WCAG 3.3.2). Shared by the portfolio overview's and the aggregated overview's column
 * forms.
 */
export function lockedWhenEditing(description: string, isEditing: boolean): string {
  return isEditing
    ? format(strings.ColumnFieldLockedDescription, description, strings.ColumnFieldLockedText)
    : description
}
