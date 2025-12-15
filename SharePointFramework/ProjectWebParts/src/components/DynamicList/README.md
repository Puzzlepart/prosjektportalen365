# Dynamic List Web Part

A flexible, configurable web part for displaying SharePoint list data in a dynamic grid view. This web part is designed to replace the TimelineList component with a more generalized approach.

## Features

- **Dynamic List Support**: Display data from any SharePoint list by configuring the list name
- **Sortable Columns**: All columns are sortable by clicking the column headers
- **Multi-selection**: Select multiple items with checkboxes
- **Resizable Columns**: Drag column borders to adjust width
- **Command Bar**: Optional toolbar with refresh and filter actions
- **Responsive**: Adapts to container width automatically

## Properties

### Configuration Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `webContextMode` | 'current' \| 'hub' \| 'custom' | 'current' | Determines which SharePoint site to use: **current** (current project), **hub** (portfolio hub site), or **custom** (custom URL) |
| `webUrl` | string | - | Custom site URL (only used when webContextMode is 'custom') |
| `listName` | string | - | The internal name of the SharePoint list to display. **Selected from dropdown** of available lists |
| `viewName` | string | 'All Fields' | The view title to use for field selection (for backward compatibility) |
| `defaultViewId` | string | null | **Default view ID** (SharePoint item ID). **Takes precedence over viewName**. Selected from dropdown of available views |
| `hiddenColumns` | string[] | [] | Array of internal field names to hide. If specified, these columns will be excluded from display (filters at rendering level). Use the multi-select control in property pane to choose columns to hide |
| `nonFilterableColumns` | string[] | [] | Array of internal field names that should NOT be filterable. By default, Note, Date, and Number type fields are automatically added to this list. Use the multi-select control to add/remove fields from filtering |
| `title` | string | - | Title to display above the list (defaults to list title) |
| `showSearchBox` | boolean | `false` | Show/hide the search box for filtering items |
| `mode` | 'multi' \| 'single' | 'multi' | Display mode: multi-item grid or single-item detail view |
| `showCommandBar` | boolean | `true` | Show/hide the command bar with actions |
| `showFilters` | boolean | `false` | Enable filter panel (future feature) |
| `useProjectContentColumnNames` | boolean | `true` | Use column display names from ProjectContentColumns (Prosjektinnholdskolonner). If false, uses names directly from the list/library |
| `showNewButton` | boolean | `true` | Show/hide the "Ny" (New) button for creating new list items |
| `showEditButton` | boolean | `true` | Show/hide the "Rediger" (Edit) button for editing selected items |
| `showDeleteButton` | boolean | `true` | Show/hide the "Slett" (Delete) button for deleting selected items |
| `showRefreshButton` | boolean | `true` | Show/hide the "Oppdater" (Refresh) button for reloading data |
| `showExportButton` | boolean | `true` | Show/hide the "Eksporter til Excel" (Export to Excel) button |
| `showUploadButton` | boolean | `true` | Show/hide the file upload option in document libraries |
| `showNewWordButton` | boolean | `true` | Show/hide the "Nytt Word-dokument" option in document libraries |
| `showNewExcelButton` | boolean | `true` | Show/hide the "Nytt Excel-dokument" option in document libraries |
| `showNewPowerPointButton` | boolean | `true` | Show/hide the "Nytt PowerPoint-dokument" option in document libraries |
| `showViewModeToggle` | boolean | `true` | Show/hide the folder/flat view toggle in document libraries |
| `infoText` | string | - | Additional information text to display |

### View Selection Behavior

The webpart supports view selection similar to PortfolioOverview, with **defaultViewId taking precedence** over viewName.

#### Column Selection Priority

1. **hiddenColumns** (if specified) - Hides selected columns from the view
2. **defaultViewId** (if specified) - Uses columns from SharePoint view ID
3. **viewName** (if specified) - Uses columns from view title (backward compatibility)
4. **"All Fields"** (default) - Shows all list fields

#### View Selection Priority

1. **hiddenColumns** (if specified) - Filters columns after view selection
2. **defaultViewId** (if specified) - Uses SharePoint view ID
2. **viewName** (if specified) - Uses view title (backward compatibility)
3. **"All Fields"** (default) - Shows all list fields

#### All Fields (Default)

- Fetches all fields directly from the list's field collection
- Filters: `Hidden eq false and ReadOnlyField eq false`
- Shows all editable, non-system fields
- No specific order (alphabetical by default)

#### Specific View (by ID or Title)

- Fetches only fields included in the selected view
- Respects the view's field order
- Ideal for displaying specific subsets of fields
- Default view is marked with "(Default)" label
- Uses SharePoint view ID for reliable identification

### Display Modes

#### Multi-Item Mode (`mode: 'multi'`)

- Default mode for displaying multiple items
- Shows data in a sortable, resizable DataGrid
- Supports multi-selection and bulk actions
- Pagination for large lists
- Best for: Tasks, Issues, Documents, any list with multiple items

#### Single-Item Mode (`mode: 'single'`)

- Displays one item in a detailed field-by-field view
- Grid layout with responsive columns (450px minimum)
- Edit and Delete action buttons
- Automatically filters out system fields
- Best for: Settings, Configuration, Site Information, any list with a single record

**Note:** When a list only has one item, the mode automatically switches to 'single' even if not explicitly configured.

## Usage

### Basic Setup

1. Add the web part to a SharePoint page
2. Edit the web part properties
3. **Select a site mode** to determine where the list is located:
   - **Gjeldende prosjekt** (Current Project): Uses the current project site
   - **Porteføljeområde (hub)** (Hub Site): Uses the portfolio hub site that the project is connected to
   - **Egendefinert område** (Custom Site): Allows you to specify a custom SharePoint site URL
4. **(If Custom Site selected)** Enter the full SharePoint site URL
5. **Select a list** from the dropdown - all available lists from the selected site will be shown with item counts
5. **Select a view** to determine which fields to display:
   - **All Fields** (default): Shows all non-hidden, editable fields from the list
   - **Specific View**: Shows only the fields included in the selected view, in the view's order
6. Configure display options as needed

The webpart automatically fetches all available lists and views from the selected site and displays them in dropdowns for easy selection.

## Data Fetching

The web part automatically:

- Fetches all list items
- Retrieves column metadata
- Transforms lookup and person fields for display
- Handles multi-value fields

## Extensibility

The component is designed to be extended with:

- Custom filtering logic
- Custom column renderers
- Inline editing capabilities
- Export functionality
- Bulk actions

## Technical Details

### State Management

Uses React hooks with context API for state management:

- `DynamicListContext` - Provides state and props to child components
- `useDynamicList` - Main state management hook
- `useDynamicListDataFetch` - Data fetching and caching

### Performance Considerations

- Data is fetched once on mount and when dependencies change
- Column resizing is handled by Fluent UI DataGrid
- Sorting is performed client-side
- Re-renders are minimized using React.useMemo

## Future Enhancements

- [ ] Column customization (show/hide, reorder)
- [ ] Bulk operations
- [ ] Custom views/templates
