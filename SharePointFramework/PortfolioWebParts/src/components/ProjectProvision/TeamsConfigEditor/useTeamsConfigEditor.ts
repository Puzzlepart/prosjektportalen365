import { useContext, useEffect, useState } from 'react'
import { ProjectProvisionContext } from '../context'

const NON_SERIALIZABLE_KEYS = new Set([
  'dataAdapter', 'pageContext', 'spfxContext', 'webAbsoluteUrl',
  'icon', 'isTeamsContext', 'hasProjectProvisionAccess',
  'manifestId', 'provisionUrl', 'displayMode', 'sp',
  'webServerRelativeUrl', 'webTitle', 'siteId', 'isSiteAdmin',
  'buttonLabel', 'appearance', 'size', 'renderMode', 'drawerSize'
])

export function useTeamsConfigEditor() {
  const context = useContext(ProjectProvisionContext)

  const getSerializableConfig = () => {
    const config: Record<string, any> = {}
    Object.keys(context.props).forEach((key) => {
      const value = (context.props as any)[key]
      if (!NON_SERIALIZABLE_KEYS.has(key) && typeof value !== 'function') {
        config[key] = value
      }
    })
    return config
  }

  const [jsonValue, setJsonValue] = useState(() => JSON.stringify(getSerializableConfig(), null, 2))
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [hasExistingConfig, setHasExistingConfig] = useState(false)

  useEffect(() => {
    context.props.dataAdapter.loadTeamsConfig?.(context.props.provisionUrl).then((config) => {
      setHasExistingConfig(config !== null)
    })
  }, [])

  const isWorking = isSaving || isResetting

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    try {
      JSON.parse(jsonValue)
    } catch {
      setError('ConfigInvalidJson')
      return
    }
    setIsSaving(true)
    try {
      const raw = JSON.parse(jsonValue)
      const config: Record<string, any> = {}
      Object.keys(raw).forEach((key) => {
        if (!NON_SERIALIZABLE_KEYS.has(key) && typeof raw[key] !== 'function') {
          config[key] = raw[key]
        }
      })
      await context.props.dataAdapter.saveTeamsConfig(context.props.provisionUrl, config)
      setSuccess('ConfigSaveSuccess')
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) {
      setError(`${e}`)
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    setError(null)
    setSuccess(null)
    try {
      await context.props.dataAdapter.deleteTeamsConfig(context.props.provisionUrl)
      setSuccess('ConfigSaveSuccess')
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) {
      setError(`${e}`)
      setIsResetting(false)
    }
  }

  const handleJsonChange = (value: string) => {
    setJsonValue(value)
    setError(null)
    setSuccess(null)
  }

  return {
    jsonValue,
    error,
    success,
    isSaving,
    isResetting,
    isWorking,
    hasExistingConfig,
    handleSave,
    handleReset,
    handleJsonChange
  }
}
