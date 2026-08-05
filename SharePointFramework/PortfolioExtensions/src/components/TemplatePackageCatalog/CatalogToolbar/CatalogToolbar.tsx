import { format } from '@fluentui/react/lib/Utilities'
import {
  Dropdown,
  Link,
  mergeClasses,
  Option,
  SearchBox,
  Switch,
  Text,
  ToggleButton,
  Tooltip
} from '@fluentui/react-components'
import { Grid20Regular, List20Regular } from '@fluentui/react-icons'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useEffect, useRef, useState } from 'react'
import { useCatalogContext } from '../context'
import { languageLabel } from '../language'
import { ALL_FILTER, SortKey } from '../types'
import styles from './CatalogToolbar.module.scss'

export const CatalogToolbar: FC = () => {
  const {
    state,
    filteredPackages,
    categories,
    languages,
    activeFilterCount,
    hasActiveFilters,
    setFilter,
    setCompatibleOnly,
    setCategories,
    clearFilters,
    setSort,
    setRenderMode
  } = useCatalogContext()
  const { filters, sort, renderMode } = state

  const [searchValue, setSearchValue] = useState(filters.search)
  const searchBoxRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])
  useEffect(() => {
    if (filters.search === '') setSearchValue('')
  }, [filters.search])
  const onSearchChange = (value: string) => {
    setSearchValue(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setFilter('search', value), 200)
  }

  const typeOptions = [
    { value: ALL_FILTER, text: strings.CatalogFilterAllOption },
    { value: 'template', text: strings.CatalogTypeTemplate },
    { value: 'extension', text: strings.CatalogTypeExtension },
    { value: 'content', text: strings.CatalogTypeContent }
  ]
  // No 'Lokal' option: the catalog only lists cloud packages, so a local-only
  // status can never match (see StatusFilter in ../types).
  const statusOptions = [
    { value: 'all', text: strings.CatalogFilterAllOption },
    { value: 'Importert', text: strings.CatalogStatusImported },
    { value: 'Sentral', text: strings.CatalogStatusCentral },
    { value: 'update', text: strings.CatalogStatusUpdate }
  ]
  const sortOptions = [
    { value: 'newest', text: strings.CatalogSortNewest },
    { value: 'name', text: strings.CatalogSortName }
  ]

  const textFor = (options: { value: string; text: string }[], value: string) =>
    options.find((o) => o.value === value)?.text ?? ''
  const typeValue = `${strings.CatalogFilterTypeLabel}: ${textFor(typeOptions, filters.type)}`
  const categoryValue = `${strings.CatalogFilterCategoryLabel}: ${
    filters.categories.length === 0
      ? strings.CatalogFilterAllOption
      : filters.categories.length <= 2
      ? filters.categories.join(', ')
      : format(strings.CatalogFilterCategorySelectedCount, filters.categories.length)
  }`
  const statusValue = `${strings.CatalogFilterStatusLabel}: ${textFor(
    statusOptions,
    filters.status
  )}`
  const languageValue = `${strings.CatalogFilterLanguageLabel}: ${
    filters.language === ALL_FILTER
      ? strings.CatalogFilterAllOption
      : languageLabel(filters.language)
  }`
  const sortValue = `${strings.CatalogSortLabel}: ${textFor(sortOptions, sort)}`

  return (
    <div className={styles.toolbar} role='toolbar' aria-label={strings.CatalogDrawerTitle}>
      <div className={styles.filterRow}>
        <SearchBox
          ref={searchBoxRef}
          className={styles.search}
          placeholder={strings.CatalogSearchPlaceholder}
          aria-label={strings.CatalogSearchPlaceholder}
          value={searchValue}
          onChange={(_, data) => onSearchChange(data.value)}
        />

        <Tooltip content={strings.CatalogFilterTypeTooltip} relationship='description'>
          <Dropdown
            className={styles.dropdown}
            aria-label={strings.CatalogFilterTypeLabel}
            value={typeValue}
            button={{ children: <span>{typeValue}</span> }}
            selectedOptions={[filters.type]}
            onOptionSelect={(_, data) => setFilter('type', data.optionValue ?? ALL_FILTER)}
          >
            {typeOptions.map((o) => (
              <Option key={o.value} value={o.value}>
                {o.text}
              </Option>
            ))}
          </Dropdown>
        </Tooltip>

        <Tooltip content={strings.CatalogFilterCategoryTooltip} relationship='description'>
          <Dropdown
            className={styles.dropdown}
            multiselect
            aria-label={strings.CatalogFilterCategoryLabel}
            placeholder={strings.CatalogFilterCategoryLabel}
            value={categoryValue}
            button={{ children: <span>{categoryValue}</span> }}
            // 'Alle' doubles as the empty selection: it renders checked when no
            // categories are picked, and picking it clears the selection.
            selectedOptions={filters.categories.length === 0 ? [ALL_FILTER] : filters.categories}
            onOptionSelect={(_, data) =>
              setCategories(
                data.optionValue === ALL_FILTER
                  ? []
                  : data.selectedOptions.filter((value) => value !== ALL_FILTER)
              )
            }
          >
            <Option value={ALL_FILTER}>{strings.CatalogFilterAllOption}</Option>
            {categories.map((category) => (
              <Option key={category} value={category}>
                {category}
              </Option>
            ))}
          </Dropdown>
        </Tooltip>

        <Tooltip content={strings.CatalogFilterStatusTooltip} relationship='description'>
          <Dropdown
            className={styles.dropdown}
            aria-label={strings.CatalogFilterStatusLabel}
            value={statusValue}
            button={{ children: <span>{statusValue}</span> }}
            selectedOptions={[filters.status]}
            onOptionSelect={(_, data) => setFilter('status', data.optionValue ?? 'all')}
          >
            {statusOptions.map((o) => (
              <Option key={o.value} value={o.value}>
                {o.text}
              </Option>
            ))}
          </Dropdown>
        </Tooltip>

        {languages.length > 1 && (
          <Tooltip content={strings.CatalogFilterLanguageTooltip} relationship='description'>
            <Dropdown
              className={styles.dropdown}
              aria-label={strings.CatalogFilterLanguageLabel}
              value={languageValue}
              button={{ children: <span>{languageValue}</span> }}
              selectedOptions={[filters.language]}
              onOptionSelect={(_, data) => setFilter('language', data.optionValue ?? ALL_FILTER)}
            >
              <Option value={ALL_FILTER}>{strings.CatalogFilterAllOption}</Option>
              {languages.map((code) => (
                <Option key={code} value={code}>
                  {languageLabel(code)}
                </Option>
              ))}
            </Dropdown>
          </Tooltip>
        )}
      </div>

      <div className={styles.actionsRow}>
        <Tooltip content={strings.CatalogSortTooltip} relationship='description'>
          <Dropdown
            className={styles.dropdown}
            aria-label={strings.CatalogSortLabel}
            value={sortValue}
            button={{ children: <span>{sortValue}</span> }}
            selectedOptions={[sort]}
            onOptionSelect={(_, data) => setSort((data.optionValue as SortKey) ?? 'newest')}
          >
            {sortOptions.map((o) => (
              <Option key={o.value} value={o.value}>
                {o.text}
              </Option>
            ))}
          </Dropdown>
        </Tooltip>

        <div className={styles.viewToggle} role='group' aria-label={strings.CatalogViewGrid}>
          <Tooltip content={strings.CatalogViewGrid} relationship='label'>
            <ToggleButton
              appearance='subtle'
              checked={renderMode === 'grid'}
              icon={<Grid20Regular />}
              aria-label={strings.CatalogViewGrid}
              onClick={() => setRenderMode('grid')}
            />
          </Tooltip>
          <Tooltip content={strings.CatalogViewList} relationship='label'>
            <ToggleButton
              appearance='subtle'
              checked={renderMode === 'list'}
              icon={<List20Regular />}
              aria-label={strings.CatalogViewList}
              onClick={() => setRenderMode('list')}
            />
          </Tooltip>
        </div>

        <Tooltip content={strings.CatalogFilterCompatibleOnlyTooltip} relationship='description'>
          <Switch
            className={styles.compatibleSwitch}
            label={strings.CatalogFilterCompatibleOnly}
            checked={filters.compatibleOnly}
            onChange={(_, data) => setCompatibleOnly(data.checked)}
          />
        </Tooltip>

        <Tooltip content={strings.CatalogClearFiltersTooltip} relationship='description'>
          <Link
            className={mergeClasses(
              styles.clearFilters,
              !hasActiveFilters && styles.clearFiltersHidden
            )}
            tabIndex={hasActiveFilters ? 0 : -1}
            aria-hidden={!hasActiveFilters}
            onClick={() => {
              clearFilters()
              searchBoxRef.current?.focus()
            }}
          >
            {format(strings.CatalogClearFiltersCount, activeFilterCount)}
          </Link>
        </Tooltip>

        <div className={styles.spacer} />

        <Text size={200} className={styles.count} aria-live='polite'>
          {format(strings.CatalogResultCount, filteredPackages.length)}
        </Text>
      </div>
    </div>
  )
}
