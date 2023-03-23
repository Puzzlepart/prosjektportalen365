## Installation channels

To support installing several instances of _Prosjektportalen 365_ in a tenant, we support **installation channels**.

### Generating a new channel configuration
To generate a new channel configuration, use the `npm` script `generate-channel-config`.

To generate a new channel configuration for `test`:

```javascript
npm run-script generate-channel-config test
```

To update an existing channel configuration, add the flag `/update`:

```javascript
npm run-script generate-channel-config test /update
```

### Building a new release for a channel
To build a new release for a channel, add the `-Channel` flag when running the release-script.

**Example (buiding for test channel):**
```powershell
Install/Build-Release.ps1 -Channel test
```