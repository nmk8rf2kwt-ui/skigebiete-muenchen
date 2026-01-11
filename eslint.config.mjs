import globals from "globals";
import pluginJs from "@eslint/js";

export default [
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.jest,
                L: "readonly",
                Chart: "readonly"
            }
        }
    },
    pluginJs.configs.recommended,
    {
        rules: {
            "no-unused-vars": ["warn", {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_"
            }],
            "no-undef": "warn",
            "no-console": "off"
        },
        ignores: ["e2e/*", "dist/*", "coverage/*", "docs/*"]
    }
];
