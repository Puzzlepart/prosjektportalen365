// Makes the @testing-library/jest-dom matchers (toBeInTheDocument, toHaveClass, ...) known to the
// compiler in *.test.tsx files. The rig pins `typeRoots`, so the package cannot be listed under
// `compilerOptions.types`; a reference directive resolves it through normal module resolution.
// The matchers themselves are registered at runtime by pp365-jest-config/lib/setup.js.
/// <reference types="@testing-library/jest-dom" />
