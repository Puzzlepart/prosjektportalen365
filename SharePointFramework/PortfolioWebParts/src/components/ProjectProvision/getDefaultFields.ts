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
      dataType: 'userMulti',
      hidden: true,
      level: 0
    },
    {
      order: 90,
      fieldName: 'alias',
      displayName: strings.Provision.AliasFieldLabel,
      dataType: 'text',
      disabled: true,
      hidden: false,
      level: 0
    },
    {
      order: 100,
      fieldName: 'url',
      displayName: strings.Provision.UrlFieldLabel,
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
      dataType: 'boolean',
      hidden: false,
      level: 1
    },
    {
      order: 120,
      fieldName: 'teamTemplate',
      displayName: strings.Provision.TeamTemplateFieldLabel,
      description: strings.Provision.TeamTemplateFieldDescription,
      dataType: 'choice',
      hidden: false,
      level: 1
    },
    {
      order: 130,
      fieldName: 'isConfidential',
      displayName: strings.Provision.ConfidentialFieldLabel,
      description: strings.Provision.ConfidentialFieldDescription,
      dataType: 'boolean',
      hidden: false,
      level: 1
    },
    {
      order: 140,
      fieldName: 'privacy',
      displayName: strings.Provision.PrivacyFieldLabel,
      description: strings.Provision.PrivacyFieldDescription,
      dataType: 'choice',
      hidden: false,
      level: 1
    },
    {
      order: 150,
      fieldName: 'externalSharing',
      displayName: strings.Provision.ExternalSharingFieldLabel,
      description: strings.Provision.ExternalSharingFieldDescription,
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
      dataType: 'guest',
      hidden: false,
      level: 1
    },
    {
      order: 170,
      fieldName: 'sensitivityLabel',
      displayName: strings.Provision.SensitivityLabelFieldLabel,
      description: strings.Provision.SensitivityLabelFieldDescription,
      dataType: 'choice',
      hidden: false,
      level: 1
    },
    {
      order: 180,
      fieldName: 'sensitivityLabelLibrary',
      displayName: strings.Provision.SensitivityLabelLibraryFieldLabel,
      description: strings.Provision.SensitivityLabelLibraryFieldDescription,
      dataType: 'choice',
      hidden: false,
      level: 1
    },
    {
      order: 190,
      fieldName: 'retentionLabel',
      displayName: strings.Provision.RetentionLabelFieldLabel,
      description: strings.Provision.RetentionLabelFieldDescription,
      dataType: 'choice',
      hidden: false,
      level: 1
    },
    {
      order: 200,
      fieldName: 'expirationDate',
      displayName: strings.Provision.ExpirationDateFieldLabel,
      description: strings.Provision.ExpirationDateFieldDescription,
      dataType: 'date',
      hidden: false,
      level: 1
    },
    {
      order: 210,
      fieldName: 'readOnlyGroup',
      displayName: strings.Provision.ReadOnlyGroupFieldLabel,
      description: strings.Provision.ReadOnlyGroupFieldDescription,
      dataType: 'boolean',
      hidden: true,
      level: 2
    },
    {
      order: 220,
      fieldName: 'internalChannel',
      displayName: strings.Provision.InternalChannelFieldLabel,
      description: strings.Provision.InternalChannelFieldDescription,
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
      dataType: 'image',
      hidden: false,
      level: 2
    },
    {
      order: 240,
      fieldName: 'language',
      displayName: strings.Provision.LanguageFieldLabel,
      dataType: 'choice',
      disabled: true,
      hidden: false,
      level: 2
    },
    {
      order: 250,
      fieldName: 'timeZone',
      displayName: strings.Provision.TimeZoneFieldLabel,
      dataType: 'choice',
      disabled: true,
      hidden: false,
      level: 2
    },
    {
      order: 260,
      fieldName: 'hubSiteTitle',
      displayName: strings.Provision.HubSiteFieldLabel,
      dataType: 'choice',
      disabled: true,
      hidden: false,
      level: 2
    }
  ]
}
