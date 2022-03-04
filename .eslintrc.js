const testingLibraryRules = {
  "testing-library/await-async-query": "error",
  "testing-library/await-async-utils": "error",
  "testing-library/no-await-sync-events": "error",
  "testing-library/no-await-sync-query": "error",
  "testing-library/no-debugging-utils": "warn",
  "testing-library/no-dom-import": ["error", "react"],
  "testing-library/no-promise-in-fire-event": "error",
  "testing-library/no-render-in-setup": "error",
  "testing-library/no-unnecessary-act": "error",
  "testing-library/no-wait-for-empty-callback": "error",
  "testing-library/no-wait-for-multiple-assertions": "error",
  "testing-library/no-wait-for-side-effects": "error",
  "testing-library/no-wait-for-snapshot": "error",
  "testing-library/prefer-find-by": "error",
  "testing-library/prefer-presence-queries": "error",
  "testing-library/prefer-query-by-disappearance": "error",
  "testing-library/prefer-screen-queries": "warn",
  "testing-library/prefer-user-event": "warn",
  "testing-library/prefer-wait-for": "error",
  "testing-library/render-result-naming-convention": "warn",
};

/**
 * @type {import('@types/eslint').Linter.BaseConfig}
 */
module.exports = {
  extends: ["@remix-run/eslint-config", "prettier"],
  rules: {
    // having a type the same name as a variable is totally fine
    "@typescript-eslint/no-redeclare": "off",
    "@typescript-eslint/consistent-type-imports": "error",
  },
  overrides: [
    {
      files: ["**/*.test.{js,jsx,ts,tsx}"],
      env: {
        "jest/globals": true,
      },
      plugins: ["jest-dom", "jest", "testing-library"],
      settings: {
        jest: {
          version: 27,
        },
      },
      rules: {
        "jest/no-conditional-expect": "error",
        "jest/no-deprecated-functions": "error",
        "jest/no-disabled-tests": "warn",
        "jest/no-export": "error",
        "jest/no-focused-tests": "error",
        "jest/no-identical-title": "error",
        "jest/no-if": "error",
        "jest/no-interpolation-in-snapshots": "error",
        "jest/no-large-snapshots": ["warn", { maxSize: 300 }],
        "jest/no-mocks-import": "error",
        "jest/valid-describe-callback": "error",
        "jest/valid-expect": "error",
        "jest/valid-expect-in-promise": "error",
        "jest/valid-title": "warn",

        "jest-dom/prefer-checked": "error",
        "jest-dom/prefer-empty": "error",
        "jest-dom/prefer-enabled-disabled": "error",
        "jest-dom/prefer-focus": "error",
        "jest-dom/prefer-in-document": "error",
        "jest-dom/prefer-required": "error",
        "jest-dom/prefer-to-have-attribute": "error",
        "jest-dom/prefer-to-have-class": "error",
        "jest-dom/prefer-to-have-style": "error",
        "jest-dom/prefer-to-have-text-content": "error",
        "jest-dom/prefer-to-have-value": "error",

        ...testingLibraryRules,
      },
    },
    {
      files: ["cypress/**/*.{js,jsx,ts,tsx}"],
      rules: {
        ...testingLibraryRules,
        // override these because they don't make sense in cypress:
        "testing-library/prefer-screen-queries": "off",
        "testing-library/await-async-query": "off",
      },
    },
  ],
};
