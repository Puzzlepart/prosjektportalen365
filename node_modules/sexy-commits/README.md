<!-- ⚠️ This README has been generated from the file(s) "README" ⚠️--><p align="center">
  <img src="logo.png" alt="Logo" width="323" height="113" />
</p> <p align="center">
  <b>Sexy commits using gitmoji.dev and inquirer-autocomplete-prompt</b></br>
  <sub><sub>
</p>

<br />


[![version](https://img.shields.io/badge/version-0.3.5-green.svg)](https://semver.org)

Sexy commits using your config from `package.json`.

Uses `gitmoji` mapping config from your `package.json` and `inquirer` to prompt you for what you did and a brief explanation (used as commit message).

```json
{
  "gitmoji": {
    "build": [
      "🏗️",
      "Make architectural changes"
    ],
    "ci": [
      "👷",
      "Add or update CI build system"
    ],
    "chore": [
      "💄",
      "Boring chores"
    ]
  }
}
```


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)](#this-is-how-it-works)

## ➤ This is how it works

### Add npm script

Add npm script `commit` that runs `sexy-commits`.

```json
{
  "scripts": {
    "commit": "sexy-commits"
  }
}
```


### Run the script

```shell
npm run commit
```



### Select what you did

![image-20210326144343892](assets/image-20210326144343892.png)

### Enter a short summary

![image-20210326144354677](assets/image-20210326144354677.png)

### With arguments

You can also call run `sexy-commits`with args.

```shell
npm run commit [add] [type] [message]
```


Where **[add]** is what do add - either `all`or a pattern, and **[type]** is what kind of change you did (depends on your `gitmoji` config).

#### Example 1

You did a **fix** and want to commit **all changes**:

```shell
npm run commit all fix
```



#### Example 2

You did a **style** adjustment and want to commit only what's in the **theme** folder.

```shell
npm run commit style theme "updated dark theme"
```

### Alias support

With `v0.3.1`we introduces alias support. Add a third element to your gitmoji config which is an array of aliases. Here you can see we mapped `build` to **ci** and `boring`and `chores`to **chore**.

```json
{
  "gitmoji": {
    "ci": [
      "👷",
      "Add or update CI build system",
      ["build"]
    ],
    "chore": [
      "💄",
      "Boring chores",
      ["boring", "chores"]
    ]
  }
}
```

#### Example 1

You can now do the following:

```shell
npm run commit boring "it's so boring to use regular git commits"
```

