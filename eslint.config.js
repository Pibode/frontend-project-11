import js from "@eslint/js"
import globals from "globals"
import stylistic from "@stylistic/eslint-plugin"

export default [
  {
    ignores: ["dist", "node_modules"],
  },
  js.configs.recommended,
  {
    plugins: {
      "@stylistic": stylistic,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "_" }],
      "@stylistic/semi": ["error", "never"],
      "@stylistic/arrow-parens": [
        "error",
        "as-needed",
        { requireForBlockBody: true },
      ],
      "@stylistic/padded-blocks": ["error", "never"],
      "@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "@stylistic/no-trailing-spaces": "error",
    },
  },
]
