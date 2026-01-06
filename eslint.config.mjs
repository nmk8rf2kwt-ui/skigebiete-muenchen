import globals from "globals";
import pluginJs from "@eslint/js";

export default [
    {
        ignores: ["node_modules/**", "coverage/**"]
    },
    pluginJs.configs.recommended,
    {
        files: ["**/*.js"],
        languageOptions: {
            sourceType: "module",
            ecmaVersion: 2022,
            globals: {
                ...globals.browser,
                ...globals.node,
                L: "readonly",
                Chart: "readonly"
            }
        },
        rules: {
            "no-undef": "error",
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "no-empty": "warn"
        }
    },
    {
        files: ["**/tests/**/*.js", "**/*.test.js"],
        languageOptions: {
            globals: {
                ...globals.jest
            }
        }
    }
];
