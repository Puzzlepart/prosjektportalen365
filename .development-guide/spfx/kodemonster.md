# Kodemønstre i SPFx-løsningene

Denne guiden forklarer de viktigste kodemønstrene vi bruker i SharePoint Framework-løsningene. Følg disse mønstrene når du lager nye komponenter eller endrer eksisterende.

## Innhold

- [Komponentstruktur (Barrel-eksport)](#komponentstruktur-barrel-eksport)
- [Hook-mønsteret (useKomponent)](#hook-mønsteret-usekomponent)
- [Context-mønsteret](#context-mønsteret)
- [Reducer-mønsteret](#reducer-mønsteret)
- [Lokalisering (loc)](#lokalisering-loc)
- [SCSS-moduler](#scss-moduler)
- [Fluent UI v9](#fluent-ui-v9)

---

## Komponentstruktur (Barrel-eksport)

Alle komponenter følger et konsekvent mappestruktur-mønster. En komponentmappe inneholder alltid en **barrel-fil** (`index.ts`) som re-eksporterer, en **navngitt komponentfil** og støttefiler.

### Mappestruktur

```
KomponentNavn/
├── index.ts                        # Barrel-eksport (kun re-eksport)
├── KomponentNavn.tsx                # Selve React-komponenten
├── KomponentNavn.module.scss        # CSS-moduler (styles)
├── KomponentNavn.module.scss.ts     # Auto-generert type-fil for styles
├── useKomponentNavn.ts              # Hook med logikk (state, handlers)
├── types.ts                         # Props, state og andre typer
├── context.ts                       # React Context (valgfritt)
├── reducer.ts                       # Redux Toolkit-reducer (valgfritt)
└── UnderKomponent/                  # Underkomponenter (følger samme mønster)
    ├── index.ts
    ├── UnderKomponent.tsx
    └── ...
```

### Barrel-filen (`index.ts`)

Barrel-filen er alltid en `.ts`-fil (ikke `.tsx`) og inneholder **kun re-eksporter**. Den skal aldri inneholde logikk eller JSX.

```ts
// index.ts
export * from './KomponentNavn'
export * from './types'
```

> **Hvorfor?** 
> - Ryddig importsti: `import { KomponentNavn } from './KomponentNavn'` i stedet for `import { KomponentNavn } from './KomponentNavn/KomponentNavn'`
> - Kontrollert API: Du bestemmer hva som eksponeres ut av mappen
> - Konsistent mønster: Alle komponenter fungerer likt

### Ekte eksempel: `TemplateSelector`

```
TemplateSelector/
├── index.ts                          # export * from './TemplateSelector'
├── TemplateSelector.tsx              # React-komponent
├── TemplateSelector.module.scss      # Styles
├── useTemplateSelector.tsx           # All logikk (state, filtrering, handlers)
└── types.ts                          # TemplateSelectorMode type
```

**index.ts:**
```ts
export * from './TemplateSelector'
export * from './types'
```

**TemplateSelector.tsx** (forenklet):
```tsx
import { useTemplateSelector } from './useTemplateSelector'
import styles from './TemplateSelector.module.scss'

export const TemplateSelector: FC = () => {
  const { mode, matchingTemplates, onTemplateSelect, ... } = useTemplateSelector()

  return (
    <div className={styles.root}>
      {/* JSX her — kun presentasjon */}
    </div>
  )
}
```

### Ekte eksempel: `ProjectSetupDialog` (større komponent)

```
ProjectSetupDialog/
├── index.ts                              # Barrel
├── ProjectSetupDialog.tsx                # Hovedkomponent
├── ProjectSetupDialog.module.scss        # Styles
├── ProjectSetupDialog.module.scss.ts     # Auto-generert type-fil
├── useProjectSetupDialog.ts              # Hook med reducer, submit, validering
├── types.ts                              # IProjectSetupDialogProps, IProjectSetupDialogState
├── context.ts                            # ProjectSetupDialogContext
├── reducer.ts                            # Redux Toolkit reducer
├── TemplateSelector/                     # Underkomponent (eget barrel-mønster)
│   ├── index.ts
│   └── ...
├── ExtensionsSection/                    # Underkomponent
│   ├── index.ts
│   └── ...
└── ContentConfigSection/                 # Underkomponent
    ├── index.ts
    └── ...
```

---

## Hook-mønsteret (`useKomponent`)

All komponentlogikk (state, side effects, event handlers, beregninger) plasseres i en **custom hook** med prefiks `use`. Komponenten selv skal kun inneholde JSX/presentasjon.

### Hvorfor?

- **Separasjon**: Logikk og presentasjon er adskilt
- **Testbarhet**: Hooken kan testes uavhengig av rendering
- **Lesbarhet**: Komponenten blir kort og lett å forstå

### Mønster

```ts
// useKomponentNavn.ts
export function useKomponentNavn(props?: IKomponentNavnProps) {
  // State
  const [value, setValue] = useState('')

  // Side effects
  useEffect(() => { /* ... */ }, [])

  // Handlers
  const onSomethingChanged = () => { /* ... */ }

  // Beregnede verdier
  const filteredItems = useMemo(() => { /* ... */ }, [items])

  // Returner alt komponenten trenger
  return {
    value,
    filteredItems,
    onSomethingChanged
  }
}
```

```tsx
// KomponentNavn.tsx
export const KomponentNavn: FC<IKomponentNavnProps> = (props) => {
  const { value, filteredItems, onSomethingChanged } = useKomponentNavn(props)

  return <div>{/* Bruk verdiene fra hooken */}</div>
}
```

### Ekte eksempel: `useProjectSetupDialog`

```ts
export function useProjectSetupDialog(props: IProjectSetupDialogProps) {
  const [state, dispatch] = useReducer(createReducer(props.data), initialState)

  useEffect(() => {
    dispatch(INIT())
  }, [])

  const onSubmit = () => {
    props.onSubmit(state)
  }

  const isConfigDisabled = (type: 'extensions' | 'contentConfig'): boolean => {
    // ... valideringslogikk
  }

  return { state, dispatch, onSubmit, isConfigDisabled }
}
```

> **Tips:** Hooken kan bruke andre hooks som `useContext`, `useReducer`, `useMemo` osv. Komponenten destrukturerer bare returverdien.

---

## Context-mønsteret

Når en komponent har underkomponenter som trenger tilgang til felles state, bruker vi React Context. Dette unngår "prop drilling" (å sende props gjennom mange nivåer).

### Mønster

```ts
// context.ts
import { createContext, useContext } from 'react'

export interface IKomponentContext {
  props: IKomponentProps
  state: IKomponentState
  dispatch: React.Dispatch<AnyAction>
}

export const KomponentContext = createContext<IKomponentContext>(null)

export function useKomponentContext() {
  return useContext(KomponentContext)
}
```

### Bruk i hovedkomponenten (Provider)

```tsx
// KomponentNavn.tsx
export const KomponentNavn: FC<IKomponentProps> = (props) => {
  const { state, dispatch } = useKomponentHook(props)

  return (
    <KomponentContext.Provider value={{ props, state, dispatch }}>
      <UnderKomponent />    {/* Har nå tilgang til context */}
      <AnnenKomponent />    {/* Har også tilgang */}
    </KomponentContext.Provider>
  )
}
```

### Bruk i underkomponent (Consumer)

```ts
// useUnderKomponent.ts
export function useUnderKomponent() {
  const context = useKomponentContext()
  // Bruk context.props, context.state, context.dispatch
}
```

### Ekte eksempel

`ProjectSetupDialog` bruker context slik at `TemplateSelector`, `ExtensionsSection` og `ContentConfigSection` alle har tilgang til valgt mal, state og dispatch uten å sende props manuelt.

---

## Reducer-mønsteret

For komponenter med kompleks state bruker vi **Redux Toolkit** sin `createAction` og en reducer-funksjon med `useReducer`.

### Mønster

```ts
// reducer.ts
import { createAction, createReducer } from '@reduxjs/toolkit'

export const SOME_ACTION = createAction<PayloadType>('SOME_ACTION')
export const ANOTHER_ACTION = createAction('ANOTHER_ACTION')

export const initialState: IKomponentState = {
  // ... startverdier
}

export default (data: IData) =>
  createReducer(initialState, {
    [SOME_ACTION.type]: (state, action) => {
      state.someField = action.payload
    },
    [ANOTHER_ACTION.type]: (state) => {
      // ... oppdater state
    }
  })
```

Brukes i hooken:
```ts
const [state, dispatch] = useReducer(createReducer(props.data), initialState)
dispatch(SOME_ACTION(payload))
```

---

## Lokalisering (loc)

Alle brukersynlige tekster skal lokaliseres. SPFx bruker en `loc/`-mappe med følgende filer:

```
loc/
├── myStrings.d.ts    # TypeScript-deklarasjon (interface med alle nøkler)
├── nb-no.js          # Norsk bokmål (standard)
└── en-us.js          # Engelsk
```

### Legge til en ny tekststreng

**Steg 1:** Legg til i TypeScript-deklarasjonen (`myStrings.d.ts`):
```ts
declare interface IProjectExtensionsStrings {
  // ... eksisterende strenger
  MinNyeTekst: string
}
```

**Steg 2:** Legg til norsk oversettelse (`nb-no.js`):
```js
define([], function () {
  return {
    // ... eksisterende strenger
    MinNyeTekst: 'Min nye tekst på norsk',
  }
})
```

**Steg 3:** Legg til engelsk oversettelse (`en-us.js`):
```js
define([], function () {
  return {
    // ... eksisterende strenger
    MinNyeTekst: 'My new text in English',
  }
})
```

**Steg 4:** Bruk i koden:
```tsx
import * as strings from 'ProjectExtensionsStrings'

<Text>{strings.MinNyeTekst}</Text>
```

> **Viktig:** Pass på at det ikke kommer doble kommaer (`,,`) i `.js`-filene — dette vil føre til at modulen ikke laster og hele appen krasjer.

### Formateringsstrenger

For tekster med dynamiske verdier, bruk `format` fra `@fluentui/react`:
```tsx
import { format } from '@fluentui/react'

// I loc-fil: ProgressStepCountText: 'Steg {0} av {1}'
format(strings.ProgressStepCountText, currentStep, totalSteps)
```

---

## SCSS-moduler

Vi bruker CSS-moduler (`.module.scss`) for scoped styling. Klassene blir automatisk unike per komponent.

### Mønster

```scss
// KomponentNavn.module.scss
.root {
  width: 850px !important;
  max-width: 850px !important;
}

.content {
  min-height: auto;
  overflow: hidden;
}

.subText {
  margin-bottom: 12px;
  color: #605e5c;
  font-size: 14px;
  font-weight: 400;
}
```

Bruk i komponenten:
```tsx
import styles from './KomponentNavn.module.scss'

<div className={styles.root}>
  <p className={styles.subText}>{subText}</p>
</div>
```

### Konsistens

Dialoger (`ProjectSetupDialog`, `ProgressDialog`, `ErrorDialog`) bruker samme bredde og subText-styling:

```scss
.root {
  width: 850px !important;
  max-width: 850px !important;
}

.subText {
  margin-bottom: 12px;
  color: #605e5c;
  font-size: 14px;
  font-weight: 400;
}
```

SubText rendres som en `<p className={styles.subText}>` inne i komponentens children (ikke som en prop til `BaseDialog`), slik at stylingen er konsistent på tvers av alle dialoger.

---

## Fluent UI v9

Vi bruker **Fluent UI v9** (`@fluentui/react-components`) for UI-komponenter. Noen eldre Fluent UI v8-importerer finnes fortsatt for spesifikke verktøy (f.eks. `format` fra `@fluentui/react`).

### Vanlige v9-importer

```tsx
import {
  Button,
  Tab,
  TabList,
  Badge,
  Combobox,
  Option,
  Text,
  Tooltip,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DataGrid,
  SearchBox,
  Radio,
  RadioGroup,
  Spinner,
  Divider,
  FluentProvider,
  IdPrefixProvider,
  useId
} from '@fluentui/react-components'
```

### Ikoner

```tsx
import { ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons'

// Eller via shared-library helper:
import { getFluentIcon, getFluentIconWithFallback } from 'pp365-shared-library'
getFluentIcon('PuzzlePiece')
getFluentIconWithFallback(iconName, { color, size })
```

`getFluentIconWithFallback` tar et navn fra en liste (f.eks. `GtSecIcon`) og rendrer et bundlet Fluent-ikon (strek som fylles ved hover) dersom navnet finnes i ikonkatalogen, og et UI Fabric-fontikon (`<Icon iconName>`) ellers. Gamle UI Fabric-navn (`BarChart4`, `DateTime`, `CircleFill`, …) oversettes til Fluent-ikoner via `fabricIconAliases` i `shared-library/src/icons/fabricIconAliases.ts`. `resolveFluentIcon(name)` er det ene oppslaget (katalog → alias → `null`) som alle ikon-helpere bygger på — bruk den fremfor å slå opp i `iconCatalog` direkte. Trenger du en ikon*komponent* (f.eks. til `Tab` eller `MenuItem`) fremfor JSX, bruk `getIconComponentWithFallback(name)`.

#### Legge til et ikon i katalogen

Katalogen i `shared-library/src/icons/iconCatalog.ts` er bevisst kuratert: `pp365-shared-library` bundles inn i hvert eneste webdel-entrypoint, så `import * as Icons from '@fluentui/react-icons'` ville lagt ~3,6 MB på hver bundle (ESLint stopper dette). Slik legger du til et nytt ikon:

1. Verifiser at både Regular- og Filled-varianten finnes:

   ```sh
   grep -c "\bNavnRegular: " SharePointFramework/shared-library/node_modules/@fluentui/react-icons/lib/icons/chunk-*.d.ts
   grep -c "\bNavnFilled: " SharePointFramework/shared-library/node_modules/@fluentui/react-icons/lib/icons/chunk-*.d.ts
   ```

2. Legg til de to navngitte importene og en `Navn: { regular: NavnRegular, filled: NavnFilled }`-oppføring i `src/icons/iconCatalog.ts`. Aldri `import *`, og aldri fra `lib/sizedIcons`.
3. Erstatter ikonet et UI Fabric-navn som ligger som standardverdi i malene (`Statusseksjoner`, `Portefoljevisninger`, `Datakilder`)? Legg da til et alias i `fabricIconAliases.ts` (eksisterende tenanter beholder de gamle radverdiene for alltid) og oppdater de fire feltbeskrivelsene i `Templates/Portfolio/Resources.*.resx` (`SiteFields_GtSecIcon_Description`, `SiteFields_GtPortfolioFabricIcon_Description`, `SiteFields_GtIconName_Description`, `SiteFields_GtPortfolioColumnIconName_Description`).
4. Kostnad: ≈ 1,2 KB uminifisert per ikonpar per bundle-kopi — hold katalogen til ikoner som faktisk brukes.
5. Bygg shared-library på nytt før du bruker ikonet fra en løsning: `rush rebuild -o pp365-shared-library`.

### FluentProvider og IdPrefixProvider

Alle dialoger wrappes i `FluentProvider` med prosjektets egne tema og `IdPrefixProvider` for å unngå ID-kollisjoner med SharePoint:

```tsx
import { customLightTheme } from 'pp365-shared-library'

<IdPrefixProvider value={fluentProviderId}>
  <FluentProvider theme={customLightTheme}>
    {/* ... */}
  </FluentProvider>
</IdPrefixProvider>
```

---

## Oppsummering

| Mønster | Fil | Formål |
|---------|-----|--------|
| Barrel-eksport | `index.ts` | Ryddig re-eksport, kontrollert API |
| Navngitt komponent | `KomponentNavn.tsx` | Kun JSX/presentasjon |
| Custom hook | `useKomponentNavn.ts` | All logikk, state, handlers |
| Types | `types.ts` | Props, state, og andre interfaces |
| Context | `context.ts` | Delt state mellom under-komponenter |
| Reducer | `reducer.ts` | Kompleks state-håndtering |
| SCSS-modul | `KomponentNavn.module.scss` | Scoped styles |
| Lokalisering | `loc/nb-no.js`, `en-us.js`, `myStrings.d.ts` | Flerspråklige tekster |
