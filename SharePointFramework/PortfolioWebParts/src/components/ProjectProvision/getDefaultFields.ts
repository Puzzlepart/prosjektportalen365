import strings from 'PortfolioWebPartsStrings'
import { IProvisionField } from './types'

/**
 * Returns the default fields and configuration for the ProjectProvision component
 */
export const getDefaultFields = (): IProvisionField[] => {
  return [
    {
      order: 10,
      fieldName: 'type',
      displayName: strings.Provision.SiteTypeFieldLabel,
      description: '',
      iconName: 'AppsList',
      dataType: 'site',
      required: true,
      hidden: false,
      level: 0
    },
    {
      order: 20,
      fieldName: 'name',
      displayName: strings.Provision.SiteNameFieldLabel,
      description: strings.Provision.SiteNameFieldDescription,
      placeholder: strings.Placeholder.SiteName,
      iconName: 'TextNumberFormat',
      dataType: 'text',
      required: true,
      hidden: false,
      level: 0
    },
    {
      order: 30,
      fieldName: 'description',
      displayName: strings.Provision.DescriptionLabel,
      description: strings.Provision.SiteDescriptionFieldDescription,
      placeholder: strings.Placeholder.SiteDescription,
      iconName: 'TextAlignLeft',
      dataType: 'note',
      required: true,
      hidden: false,
      level: 0
    },
    {
      order: 40,
      fieldName: 'justification',
      displayName: strings.Provision.BusinessJustificationFieldLabel,
      description: strings.Provision.BusinessJustificationFieldDescription,
      placeholder: strings.Placeholder.BusinessJustificationField,
      iconName: 'TextAlignLeft',
      dataType: 'note',
      required: false,
      hidden: false,
      level: 0
    },
    {
      order: 50,
      fieldName: 'additionalInfo',
      displayName: strings.Provision.AdditionalInfoFieldLabel,
      description: strings.Provision.AdditionalInfoFieldDescription,
      placeholder: strings.Placeholder.AdditionalInfoField,
      iconName: 'TextAlignLeft',
      dataType: 'note',
      required: false,
      hidden: false,
      level: 0
    },
    {
      order: 60,
      fieldName: 'owner',
      displayName: strings.Provision.OwnerFieldLabel,
      description: strings.Provision.OwnerFieldDescription,
      placeholder: strings.Placeholder.UserField,
      iconName: 'Person',
      dataType: 'userMulti',
      required: true,
      hidden: false,
      level: 0
    },
    {
      order: 70,
      fieldName: 'member',
      displayName: strings.Provision.MemberFieldLabel,
      description: strings.Provision.MemberFieldDescription,
      placeholder: strings.Placeholder.UserField,
      iconName: 'People',
      dataType: 'userMulti',
      hidden: false,
      level: 0
    },
    {
      order: 80,
      fieldName: 'requestedBy',
      displayName: strings.Provision.RequestedByFieldLabel,
      description: strings.Provision.RequestedByFieldDescription,
      placeholder: strings.Placeholder.UserField,
      iconName: 'Person',
      dataType: 'userMulti',
      hidden: true,
      level: 0
    },
    {
      order: 90,
      fieldName: 'alias',
      displayName: strings.Provision.AliasFieldLabel,
      iconName: 'TextNumberFormat',
      dataType: 'text',
      disabled: true,
      hidden: false,
      level: 0
    },
    {
      order: 100,
      fieldName: 'url',
      displayName: strings.Provision.UrlFieldLabel,
      iconName: 'Link',
      dataType: 'text',
      disabled: true,
      hidden: false,
      level: 0
    },
    {
      order: 110,
      fieldName: 'teamify',
      displayName: strings.Provision.TeamifyFieldLabel,
      description: strings.Provision.TeamifyFieldDescription,
      iconName: 'PeopleTeam',
      dataType: 'boolean',
      hidden: false,
      level: 1
    },
    {
      order: 120,
      fieldName: 'teamTemplate',
      displayName: strings.Provision.TeamTemplateFieldLabel,
      description: strings.Provision.TeamTemplateFieldDescription,
      iconName: 'PeopleAudience',
      dataType: 'choice',
      hidden: false,
      level: 1
    },
    {
      order: 130,
      fieldName: 'isConfidential',
      displayName: strings.Provision.ConfidentialFieldLabel,
      description: strings.Provision.ConfidentialFieldDescription,
      iconName: 'BoxToolbox',
      dataType: 'boolean',
      hidden: false,
      level: 1
    },
    {
      order: 140,
      fieldName: 'privacy',
      displayName: strings.Provision.PrivacyFieldLabel,
      description: strings.Provision.PrivacyFieldDescription,
      iconName: 'Eye',
      dataType: 'choice',
      hidden: false,
      level: 1
    },
    {
      order: 150,
      fieldName: 'externalSharing',
      displayName: strings.Provision.ExternalSharingFieldLabel,
      description: strings.Provision.ExternalSharingFieldDescription,
      iconName: 'Guest',
      dataType: 'boolean',
      hidden: false,
      level: 1
    },
    {
      order: 160,
      fieldName: 'guest',
      displayName: strings.Provision.GuestFieldLabel,
      description: strings.Provision.GuestFieldDescription,
      placeholder: strings.Placeholder.GuestField,
      iconName: 'People',
      dataType: 'guest',
      hidden: false,
      level: 1
    },
    {
      order: 170,
      fieldName: 'sensitivityLabel',
      displayName: strings.Provision.SensitivityLabelFieldLabel,
      description: strings.Provision.SensitivityLabelFieldDescription,
      iconName: 'PeopleCommunity',
      dataType: 'choice',
      hidden: false,
      level: 1
    },
    {
      order: 180,
      fieldName: 'sensitivityLabelLibrary',
      displayName: strings.Provision.SensitivityLabelLibraryFieldLabel,
      description: strings.Provision.SensitivityLabelLibraryFieldDescription,
      iconName: 'Library',
      dataType: 'choice',
      hidden: false,
      level: 1
    },
    {
      order: 190,
      fieldName: 'retentionLabel',
      displayName: strings.Provision.RetentionLabelFieldLabel,
      description: strings.Provision.RetentionLabelFieldDescription,
      iconName: 'Checkmark',
      dataType: 'choice',
      hidden: false,
      level: 1
    },
    {
      order: 200,
      fieldName: 'expirationDate',
      displayName: strings.Provision.ExpirationDateFieldLabel,
      description: strings.Provision.ExpirationDateFieldDescription,
      iconName: 'Calendar',
      dataType: 'date',
      hidden: false,
      level: 1
    },
    {
      order: 210,
      fieldName: 'readOnlyGroup',
      displayName: strings.Provision.ReadOnlyGroupFieldLabel,
      description: strings.Provision.ReadOnlyGroupFieldDescription,
      iconName: 'PeopleAudience',
      dataType: 'boolean',
      hidden: true,
      level: 2
    },
    {
      order: 220,
      fieldName: 'internalChannel',
      displayName: strings.Provision.InternalChannelFieldLabel,
      description: strings.Provision.InternalChannelFieldDescription,
      iconName: 'PeopleTeam',
      dataType: 'boolean',
      disabled: true,
      hidden: true,
      level: 2
    },
    {
      order: 230,
      fieldName: 'image',
      displayName: strings.Provision.ImageFieldLabel,
      description: strings.Provision.ImageFieldDescription,
      iconName: 'Image',
      dataType: 'image',
      hidden: false,
      level: 2
    },
    {
      order: 240,
      fieldName: 'language',
      displayName: strings.Provision.LanguageFieldLabel,
      iconName: 'LocalLanguage',
      dataType: 'choice',
      disabled: true,
      hidden: false,
      level: 2
    },
    {
      order: 250,
      fieldName: 'timeZone',
      displayName: strings.Provision.TimeZoneFieldLabel,
      iconName: 'Clock',
      dataType: 'choice',
      disabled: true,
      hidden: false,
      level: 2
    },
    {
      order: 260,
      fieldName: 'hubSiteTitle',
      displayName: strings.Provision.HubSiteFieldLabel,
      iconName: 'Database',
      dataType: 'choice',
      disabled: true,
      hidden: false,
      level: 2
    }
  ]
}
