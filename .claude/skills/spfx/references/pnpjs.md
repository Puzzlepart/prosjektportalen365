# PnPjs Data Access (default)

**Rule: use PnPjs for every SharePoint and Microsoft Graph data operation in SPFx.** It is the default data-access layer for this skill. Only use raw `SPHttpClient` or `MSGraphClientV3` when the user explicitly requires it, or when a dependency cannot be added to the project.

## Install

Install the **latest** PnPjs packages that match the operations you need. Pin to the major version that supports the project's SPFx/TypeScript level (read `package.json` first):

```
npm install @pnp/sp @pnp/graph --save
```

- `@pnp/sp` — SharePoint REST (lists, items, files, site, search).
- `@pnp/graph` — Microsoft Graph (users, groups, mail, calendar, Teams).

Install only the packages you actually use to keep the bundle small.

## Initialize with SPFx context

Create the PnPjs instance once using the SPFx context so auth, base URL, and telemetry are wired automatically. Do this in `onInit()` and store the instance, rather than re-creating it on every call.

```typescript
import { spfi, SPFx as spSPFx } from "@pnp/sp";
import { graphfi, SPFx as graphSPFx } from "@pnp/graph";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/graph/users";

// In a web part: this.context is WebPartContext
const sp = spfi().using(spSPFx(this.context));
const graph = graphfi().using(graphSPFx(this.context));
```

For extensions, pass the extension `this.context`. For service-scoped usage, create the instance in a service class and pass the context in.

## Selective imports

PnPjs is modular — import only the sub-modules you use so tree-shaking keeps the bundle small. Import the side-effect modules (e.g. `"@pnp/sp/items"`) once where you set up the instance.

## Common operations

```typescript
// Read items from a list (select only needed fields, page with top)
const items = await sp.web.lists
  .getByTitle("Documents")
  .items.select("Id", "Title", "Modified").top(50)();

// Create an item
await sp.web.lists.getByTitle("Tasks").items.add({ Title: "New task" });

// Update an item
await sp.web.lists.getByTitle("Tasks").items.getById(1).update({ Title: "Updated" });

// Delete an item
await sp.web.lists.getByTitle("Tasks").items.getById(1).delete();

// Microsoft Graph: current user
const me = await graph.me();
```

## Permissions for Graph

Microsoft Graph and cross-resource calls require API permissions approved in the **SharePoint admin center → API access**. Declare them in `package-solution.json` under `webApiPermissionRequests`, and tell the user an admin must approve them after deployment.

## Best practices

- Use `.select()` and `.top()` to limit payload size; never fetch all fields/rows blindly.
- Handle errors and loading states in the UI; surface failures rather than swallowing them.
- Keep data logic in a service/helper, not inside React render code.
- Match the PnPjs major version to the project's SPFx and TypeScript versions to avoid type conflicts.
