import { QueryPropertyValueType, SortDirection } from '@pnp/sp';

export const DEFAULT_SEARCH_SETTINGS = {
    Querytext: '*',
    RowLimit: 500,
    TrimDuplicates: false,
    Properties: [
        {
            Name: "EnableDynamicGroups",
            Value: {
                BoolVal: true,
                QueryPropertyValueTypeIndex: QueryPropertyValueType.BooleanType
            }
        }
    ],
    SortList: [{ Property: 'LastModifiedTime', Direction: SortDirection.Descending }],
};