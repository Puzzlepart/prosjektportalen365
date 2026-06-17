# Template Package Catalog (Malpakkekatalog)

A SPFx **ListView Command Set** on the **Maloppsett** (Template Options) list that
opens a Fluent UI v9 master–detail drawer for browsing template packages from the
central **`prosjektportalen-hosting`** catalog. A portal administrator can:

- Browse, search, filter (type / category / status) and sort the catalog.
- View package details, content summary and version history (from `CHANGELOG.md`).
- **Mode A — "Kopier til min installasjon"** (`Importert`): download the `.pppkg`,
  unzip it, validate the manifest, provision the hub, store the project-level
  assets and write a Maloppsett item.
- **Mode B — "Tilgjengeliggjør som skymal"** (`Sentral`): register a metadata-only
  Maloppsett item that points at the hosting repo (no local provisioning).
- Update or remove already-imported / central templates.

## How it is wired

| Concern | Where |
| --- | --- |
| Command entry / mount | `src/extensions/templatePackageCatalog/index.tsx` (`render` into a `document.body` placeholder) |
| UI (Fluent v9) | `src/components/TemplatePackageCatalog/` (drawer root + `CatalogToolbar`, `PackageList`, `PackageCard`, `PackageDetails`, `InstallProgress`) |
| Models | `src/models/` (`ICatalog`, `ICatalogPackage`, `IPackageManifest`, `TemplateOptionsItem`, enums, …) |
| Services | `src/services/` — `CatalogService` (catalog + changelog), `TemplateOptionsService` (read/cross-ref/write), `PackageInstaller` (Mode A), `featureFlags` |
| Visibility | Shown only on the Maloppsett list (`Lists/TemplateOptions` URL) for users with `ManageWeb` |
| Registration | `Templates/Portfolio/Objects/CustomActions.xml` (ClientSideComponentId `75f97492-…`) + `channels/*.json` (`TemplatePackageCatalog`) |
| New Maloppsett fields | `Templates/Portfolio/Objects/Lists/Maloppsett.xml` (`PpPkg*`) + `Resources.*.resx` |
| Hub web | `SPDataAdapter.portalDataService.web` |

## Configuration (CustomAction `ClientSideComponentProperties`)

```json
{
  "catalogUrl": "https://raw.githubusercontent.com/Puzzlepart/prosjektportalen-hosting/main/catalog.json",
  "userGuideUrl": "https://…",
  "featureFlagProvisioning": false
}
```

- `catalogUrl` — defaults to the hosting `main` `catalog.json`. Falls back to the
  committed `services/sampleCatalog.ts` fixture on CORS/network failure.
- `userGuideUrl` — target of the "Se brukerveiledning" footer link.
- `featureFlagProvisioning` — see below.

## Feature flag — taxonomy provisioning

Hub provisioning (fields, content types, lists, files, …) runs for real via the
existing `sp-js-provisioning` `WebProvisioner.applyTemplate` flow (the same one the
project setup template dialog uses), applied to the **hub web**.

The **taxonomy / Term Store** step **runs by default**: `sp-js-provisioning` 1.3.12
ships a Term Store handler (registered in its `DefaultHandlerMap`), so a package's
bundled term sets are provisioned as part of `applyTemplate`.

Opt out of the taxonomy step via either:

- `featureFlagProvisioning: false` on the CustomAction properties, or
- `sessionStorage.setItem('PP_DISABLE_TAXONOMY', '1')` for local testing.

When disabled, the step shows "Hoppet over (feature flag av)".

`sessionStorage.setItem('PP_DISABLE_IMPORT', '1')` disables the whole import action
during a controlled pilot.

## Dev / test

- The default `catalogUrl` points at the hosting `main` branch's raw `catalog.json`,
  which is now published — so browsing works out of the box. The committed
  `sampleCatalog.ts` fixture mirrors it and is used as an offline fallback.
- Mode A downloads the `.pppkg` from the package's `downloadUrl` (a GitHub release,
  `dummy-prosjektmal-1.0.1.pppkg`); ensure that release is published, or build it with
  the hosting repo's `scripts/build-packages.js`. Its `hub-template.json` carries
  taxonomy, so it exercises the (feature-flag-gated) taxonomy path.

## Out of scope (other repos / later phases)

- Real `.pppkg` packaging + `catalog.json` publishing — `prosjektportalen-hosting`.
- The `sp-js-provisioning` taxonomy/Term Store handler — `sp-js-provisioning` fork.
- Runtime central-template resolution in the setup wizard + project-site stamping — Phase 3.
