import { format } from '@fluentui/react/lib/Utilities'
import { Dropdown, Link, Option, SearchBox, Text } from '@fluentui/react-components'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useEffect, useRef, useState } from 'react'
import { useCatalogContext } from '../context'
import { ALL_FILTER } from '../types'
import styles from './CatalogToolbar.module.scss'

export const CatalogToolbar: FC = () => {
  const { state, filteredPackages, categories, setFilter, clearFilters, setSort } =
    useCatalogContext()
  const { filters, sort } = state

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

      <Dropdown
        className={styles.dropdown}
        aria-label={strings.CatalogFilterTypeLabel}
        value={textFor(typeOptions, filters.type)}
        selectedOptions={[filters.type]}
        onOptionSelect={(_, data) => setFilter('type', data.optionValue ?? ALL_FILTER)}
      >
        {typeOptions.map((o) => (
          <Option key={o.value} value={o.value}>
            {o.text}
          </Option>
        ))}
      </Dropdown>

      <Dropdown
        className={styles.dropdown}
        aria-label={strings.CatalogFilterCategoryLabel}
        placeholder={strings.CatalogFilterCategoryLabel}
        value={filters.category === ALL_FILTER ? strings.CatalogFilterAllOption : filters.category}
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

      <Dropdown
        className={styles.dropdown}
        aria-label={strings.CatalogFilterStatusLabel}
        value={textFor(statusOptions, filters.status)}
        selectedOptions={[filters.status]}
        onOptionSelect={(_, data) => setFilter('status', data.optionValue ?? 'all')}
      >
        {statusOptions.map((o) => (
          <Option key={o.value} value={o.value}>
            {o.text}
          </Option>
        ))}
      </Dropdown>

      <Link onClick={clearFilters}>{strings.CatalogClearFiltersText}</Link>

      <div className={styles.spacer} />

      <Text size={200} className={styles.count} aria-live='polite'>
        {format(strings.CatalogResultCount, filteredPackages.length)}
      </Text>

      <Dropdown
        className={styles.dropdown}
        aria-label={strings.CatalogSortLabel}
        value={textFor(sortOptions, sort)}
        selectedOptions={[sort]}
        onOptionSelect={(_, data) => setSort((data.optionValue as 'newest' | 'name') ?? 'newest')}
      >
        {sortOptions.map((o) => (
          <Option key={o.value} value={o.value}>
            {o.text}
          </Option>
        ))}
      </Dropdown>
    </div>
  )
}
