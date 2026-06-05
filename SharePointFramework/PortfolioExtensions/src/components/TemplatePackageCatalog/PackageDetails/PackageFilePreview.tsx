import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  Spinner,
  Text,
  tokens,
  Tooltip
} from '@fluentui/react-components'
import { Checkmark20Regular, Copy20Regular, Dismiss24Regular } from '@fluentui/react-icons'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { CatalogService } from 'services'

// Readable coding-font stack (falls back through fonts shipped with VS Code,
// macOS and Windows) instead of the default Consolas/Courier monospace token.
const CODE_FONT =
  "'Cascadia Code', 'Cascadia Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', SFMono-Regular, Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace"

const useStyles = makeStyles({
  // Default modal DialogSurface is max-width 600px — widen it by ~200px.
  surface: {
    maxWidth: '800px'
  },
  code: {
    margin: 0,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: CODE_FONT,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'pre',
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '60vh'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL
  },
  // JSON token colors.
  key: { color: tokens.colorPaletteBlueForeground2 },
  string: { color: tokens.colorPaletteGreenForeground1 },
  number: { color: tokens.colorPalettePurpleForeground2 },
  boolean: { color: tokens.colorPaletteRedForeground1 },
  null: { color: tokens.colorNeutralForeground4 }
})

type Styles = ReturnType<typeof useStyles>

/** Pretty-print JSON; fall back to the raw text for non-JSON (e.g. .txt). */
function format(text: string): { value: string; isJson: boolean } {
  try {
    return { value: JSON.stringify(JSON.parse(text), null, 2), isJson: true }
  } catch {
    return { value: text, isJson: false }
  }
}

// Matches, in order: a property key (string + colon), a string value, a
// boolean, null, or a number. Whitespace/structural chars fall through as text.
const TOKEN =
  /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false)\b|\b(null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g

/** Tokenize pretty-printed JSON into colored spans for readability. */
function highlight(json: string, styles: Styles): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let key = 0
  TOKEN.lastIndex = 0
  for (let match = TOKEN.exec(json); match !== null; match = TOKEN.exec(json)) {
    if (match.index > lastIndex) nodes.push(json.slice(lastIndex, match.index))
    const className = match[1]
      ? styles.key
      : match[2]
      ? styles.string
      : match[3]
      ? styles.boolean
      : match[4]
      ? styles.null
      : styles.number
    nodes.push(
      <span key={key++} className={className}>
        {match[0]}
      </span>
    )
    lastIndex = TOKEN.lastIndex
  }
  if (lastIndex < json.length) nodes.push(json.slice(lastIndex))
  return nodes
}

export interface IPackageFilePreviewProps {
  /** Title (the hierarchy node label). */
  title?: string
  /** Raw file URL to fetch; the dialog is open while this is set. */
  url?: string
  onClose: () => void
}

/**
 * Modal code view for a single package file (extension/content JSON). Lazily
 * fetches the raw text when opened, pretty-prints + syntax-highlights JSON, and
 * offers copy.
 */
export const PackageFilePreview: FC<IPackageFilePreviewProps> = ({ title, url, onClose }) => {
  const styles = useStyles()
  const [content, setContent] = useState<{ value: string; isJson: boolean }>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!url) return undefined
    setLoading(true)
    setError(false)
    setContent(undefined)
    setCopied(false)
    void CatalogService.getFileText(url)
      .then((text) => {
        if (cancelled) return
        setContent(format(text))
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [url])

  const rendered = useMemo(() => {
    if (!content) return null
    return content.isJson ? highlight(content.value, styles) : content.value
  }, [content, styles])

  const copy = (): void => {
    if (!content || !navigator.clipboard) return
    void navigator.clipboard.writeText(content.value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Dialog
      open={Boolean(url)}
      onOpenChange={(_, data) => {
        if (!data.open) onClose()
      }}
    >
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle
            action={
              <Button
                appearance='subtle'
                aria-label={strings.CloseLabel}
                icon={<Dismiss24Regular />}
                onClick={onClose}
              />
            }
          >
            {title}
          </DialogTitle>
          <DialogContent>
            {loading && (
              <div className={styles.loading}>
                <Spinner size='small' />
              </div>
            )}
            {!loading && error && <Text>{strings.CatalogPreviewError}</Text>}
            {!loading && !error && rendered !== null && <pre className={styles.code}>{rendered}</pre>}
          </DialogContent>
          <DialogActions>
            <Tooltip
              content={copied ? strings.CatalogPreviewCopied : strings.CatalogPreviewCopy}
              relationship='label'
            >
              <Button
                appearance='secondary'
                icon={copied ? <Checkmark20Regular /> : <Copy20Regular />}
                disabled={!content}
                onClick={copy}
              >
                {copied ? strings.CatalogPreviewCopied : strings.CatalogPreviewCopy}
              </Button>
            </Tooltip>
            <Button appearance='primary' onClick={onClose}>
              {strings.CloseLabel}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
