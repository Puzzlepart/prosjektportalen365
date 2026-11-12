import { ISearchQuery, QueryPropertyValueType, SortDirection } from '@pnp/sp/search'

/** Search defaults for paged results, newest first, with dynamic-group access enabled. */
export const DEFAULT_SEARCH_SETTINGS: ISearchQuery = {
  Querytext: '*',
  RowLimit: 500,
  TrimDuplicates: false,
  Properties: [
    {
      Name: 'EnableDynamicGroups',
      Value: {
        BoolVal: true,
        QueryPropertyValueTypeIndex: QueryPropertyValueType.BooleanType
      }
    }
  ],
  SortList: [{ Property: 'LastModifiedTime', Direction: SortDirection.Descending }]
}

/** Benefit content-type prefix used to classify search results. */
export const CONTENT_TYPE_ID_BENEFITS = '0x01004F466123309D46BAB9D5C6DE89A6CF67'
/** Measurement content-type prefix used to classify search results. */
export const CONTENT_TYPE_ID_MEASUREMENTS = '0x010039EAFDC2A1624C1BA1A444FC8FE85DEC'
/** Indicator content-type prefix used to classify search results. */
export const CONTENT_TYPE_ID_INDICATORS = '0x010073043EFE3E814A2BBEF96B8457623F95'

/** Norwegian stored moderation value accepted for published status reports. */
export const MODERATION_STATUS_PUBLISHED_NO = 'Publisert'
/** English stored moderation value accepted for published status reports. */
export const MODERATION_STATUS_PUBLISHED_EN = 'Published'
/** Search fields needed to join benefits, indicators and measurements. */
export const DEFAULT_GAINS_PROPERTIES = [
  'Path',
  'SPWebURL',
  'Title',
  'ListItemId',
  'SiteTitle',
  'SiteId',
  'ContentTypeID',
  'GtDesiredValueOWSNMBR',
  'GtMeasureIndicatorOWSTEXT',
  'GtMeasurementUnitOWSCHCS',
  'GtStartValueOWSNMBR',
  'GtMeasurementValueOWSNMBR',
  'GtMeasurementCommentOWSMTXT',
  'GtMeasurementDateOWSDATE',
  'GtGainsResponsibleOWSUSER',
  'GtGainsTurnoverOWSMTXT',
  'GtGainsTypeOWSCHCS',
  'GtPrereqProfitAchievementOWSMTXT',
  'GtRealizationTimeOWSDATE',
  'GtGainLookupId',
  'GtMeasureIndicatorLookupId',
  'GtGainsResponsible',
  'GtGainsOwner'
]
