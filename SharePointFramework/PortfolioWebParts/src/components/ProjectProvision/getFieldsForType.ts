import { IProvisionField, ITypeFieldConfiguration, IFieldDisplayNameConfiguration } from './types'
import * as strings from 'PortfolioWebPartsStrings'

/**
 * Gets field configurations based on the selected type
 * @param fields Default field configuration
 * @param typeFieldConfigurations Type-specific field configurations
 * @param selectedType The currently selected type
 * @returns Updated field configuration with type-specific display names
 */
export const getFieldsForType = (
  fields: IProvisionField[],
  typeFieldConfigurations: ITypeFieldConfiguration[],
  selectedType: string
): IProvisionField[] => {
  if (!typeFieldConfigurations || !selectedType) {
    return fields
  }

  const typeConfig = typeFieldConfigurations.find((config) => config.typeName === selectedType)
  if (!typeConfig) {
    return fields
  }

  let fieldConfigs: Record<string, IFieldDisplayNameConfiguration> = {}
  let hiddenFieldNames: string[] = []

  if (typeConfig.fieldConfigurations) {
    if (typeof typeConfig.fieldConfigurations === 'string') {
      try {
        fieldConfigs = JSON.parse(typeConfig.fieldConfigurations)
      } catch (error) {
        console.warn('Invalid JSON in field configurations:', error)
      }
    } else {
      fieldConfigs = typeConfig.fieldConfigurations
    }
  }

  if (typeConfig.hiddenFields) {
    if (typeof typeConfig.hiddenFields === 'string') {
      hiddenFieldNames = typeConfig.hiddenFields
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f)
    } else if (Array.isArray(typeConfig.hiddenFields)) {
      hiddenFieldNames = typeConfig.hiddenFields
    }
  }

  return fields.map((field) => {
    const fieldConfig = fieldConfigs[field.fieldName]
    const isHidden = hiddenFieldNames.includes(field.fieldName)

    const updatedField = { ...field }

    if (fieldConfig) {
      updatedField.displayName = fieldConfig.displayName || field.displayName
      updatedField.description = fieldConfig.description || field.description
      updatedField.placeholder = fieldConfig.placeholder || field.placeholder
    }

    if (isHidden) {
      updatedField.hidden = true
    }

    return updatedField
  })
}

/**
 * Gets default type field configurations
 */
export const getDefaultTypeFieldConfigurations = (): ITypeFieldConfiguration[] => {
  return [
    {
      typeName: 'Viva Engage Community',
      displayName: 'Viva Engage Community',
      hiddenFields: 'teamify, teamTemplate, isConfidential, externalSharing, image',
      fieldConfigurations: {
        name: {
          displayName: strings.Provision.CommunityNameFieldLabel,
          description: strings.Provision.CommunityNameFieldDescription,
          placeholder: strings.Provision.CommunityNameFieldPlaceholder
        },
        description: {
          displayName: strings.Provision.CommunityDescriptionFieldLabel,
          description: strings.Provision.CommunityDescriptionFieldDescription,
          placeholder: strings.Provision.CommunityDescriptionFieldPlaceholder
        },
        justification: {
          displayName: strings.Provision.CommunityJustificationFieldLabel,
          description: strings.Provision.CommunityJustificationFieldDescription,
          placeholder: strings.Provision.CommunityJustificationFieldPlaceholder
        },
        owner: {
          displayName: strings.Provision.CommunityOwnerFieldLabel,
          description: strings.Provision.CommunityOwnerFieldDescription,
          placeholder: strings.Provision.CommunityOwnerFieldPlaceholder
        },
        member: {
          displayName: strings.Provision.CommunityMemberFieldLabel,
          description: strings.Provision.CommunityMemberFieldDescription,
          placeholder: strings.Provision.CommunityMemberFieldPlaceholder
        },
        privacy: {
          displayName: strings.Provision.CommunityPrivacyFieldLabel,
          description: strings.Provision.CommunityPrivacyFieldDescription,
          placeholder: strings.Provision.CommunityPrivacyFieldPlaceholder
        }
      }
    },
    {
      typeName: 'Microsoft Teams Team',
      displayName: 'Microsoft Teams Team',
      fieldConfigurations: {
        name: {
          displayName: strings.Provision.TeamNameFieldLabel,
          description: strings.Provision.TeamNameFieldDescription,
          placeholder: strings.Provision.TeamNameFieldPlaceholder
        },
        description: {
          displayName: strings.Provision.TeamDescriptionFieldLabel,
          description: strings.Provision.TeamDescriptionFieldDescription,
          placeholder: strings.Provision.TeamDescriptionFieldPlaceholder
        },
        owner: {
          displayName: strings.Provision.TeamOwnerFieldLabel,
          description: strings.Provision.TeamOwnerFieldDescription,
          placeholder: strings.Provision.TeamOwnerFieldPlaceholder
        },
        member: {
          displayName: strings.Provision.TeamMemberFieldLabel,
          description: strings.Provision.TeamMemberFieldDescription,
          placeholder: strings.Provision.TeamMemberFieldPlaceholder
        },
        justification: {
          displayName: strings.Provision.TeamJustificationFieldLabel,
          description: strings.Provision.TeamJustificationFieldDescription,
          placeholder: strings.Provision.TeamJustificationFieldPlaceholder
        },
        privacy: {
          displayName: strings.Provision.TeamPrivacyFieldLabel,
          description: strings.Provision.TeamPrivacyFieldDescription,
          placeholder: strings.Provision.TeamPrivacyFieldPlaceholder
        }
      }
    }
  ]
}
