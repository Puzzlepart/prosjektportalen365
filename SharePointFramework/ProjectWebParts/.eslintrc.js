module.exports = {
    parser: '@typescript-eslint/parser',  // Specifies the ESLint parser
    extends: [
        'plugin:react/recommended',  // Uses the recommended rules from @eslint-plugin-react
        'plugin:@typescript-eslint/recommended',  // Uses the recommended rules from @typescript-eslint/eslint-plugin
    ],
    parserOptions: {
        ecmaVersion: 2018,  // Allows for the parsing of modern ECMAScript features
        sourceType: 'module',  // Allows for the use of imports
        ecmaFeatures: {
            jsx: true,  // Allows for the parsing of JSX
        },
    },
    rules: {
        /**
         * 0 = off, 1 = warn, 2 = error
         */

        "@typescript-eslint/interface-name-prefix": 0,

        "@typescript-eslint/no-explicit-any": 0,

        "react/prop-types": 0,

        "no-inferrable-types": 0,

        "@typescript-eslint/explicit-function-return-type": 0,

        "react/display-name": 0,

        "no-compare-neg-zero": 1,

        "no-console": 2,

        "default-case": 2,

        "eqeqeq": 1,

        "max-classes-per-file": 1,

        "jsx-quotes": ["error", "prefer-single"],

        "quotes": ["error", "single"],

        "yoda": 2,

        "require-await": 1,

        "semi": ["error", "never", {}]
    },
    settings: {
        react: {
            version: 'detect',  // Tells eslint-plugin-react to automatically detect the version of React to use
        },
    },
};