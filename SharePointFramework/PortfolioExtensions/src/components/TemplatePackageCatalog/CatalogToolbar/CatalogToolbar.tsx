import { format } from '@fluentui/react/lib/Utilities'
import {
  Dropdown,
  Link,
  Option,
  SearchBox,
  Text,
  ToggleButton,
  Tooltip
} from '@fluentui/react-components'
import { Grid20Regular, List20Regular } from '@fluentui/react-icons'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useEffect, useRef, useState } from 'react'
import { useCatalogContext } from '../context'
import { ALL_FILTER, SortKey } from '../types'
import styles from './CatalogToolbar.module.scss'

export const CatalogToolbar: FC = () => {
  const { state, filteredPackages, categories, setFilter, clearFilters, setSort, setRenderMode } =
    useCatalogContext()
  const { filters, sort, renderMode } = state

  // Debounced search input (~200ms) — keeps the field responsive without
  // re-filtering on every keystroke.
  const [searchValue, setSearchValue] = useState(filters.search)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])
  // Keep the input in sync when filters are cleared externally ("Tøm filtre").
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
  const statusOptions = [
    { value: 'all', text: strings.CatalogFilterAllOption },
    { value: 'Lokal', text: strings.CatalogStatusLocal },
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

  return (
    <div className={styles.toolbar} role='toolbar' aria-label={strings.CatalogDrawerTitle}>
      <SearchBox
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
          value={`${strings.CatalogFilterTypeLabel}: ${textFor(typeOptions, filters.type)}`}
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
          aria-label={strings.CatalogFilterCategoryLabel}
          placeholder={strings.CatalogFilterCategoryLabel}
          value={`${strings.CatalogFilterCategoryLabel}: ${
            filters.category === ALL_FILTER ? strings.CatalogFilterAllOption : filters.category
          }`}
          selectedOptions={[filters.category]}
          onOptionSelect={(_, data) => setFilter('category', data.optionValue ?? ALL_FILTER)}
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
          value={`${strings.CatalogFilterStatusLabel}: ${textFor(statusOptions, filters.status)}`}
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

      <Tooltip content={strings.CatalogClearFiltersTooltip} relationship='description'>
        <Link onClick={clearFilters}>{strings.CatalogClearFiltersText}</Link>
      </Tooltip>

      <div className={styles.spacer} />

      <Text size={200} className={styles.count} aria-live='polite'>
        {format(strings.CatalogResultCount, filteredPackages.length)}
      </Text>

      <Tooltip content={strings.CatalogSortTooltip} relationship='description'>
        <Dropdown
          className={styles.dropdown}
          aria-label={strings.CatalogSortLabel}
          value={`${strings.CatalogSortLabel}: ${textFor(sortOptions, sort)}`}
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
    </div>
  )
}
