# Verification Profiles

- **TARGETED**: Specific modified file linting or type check (`npm run lint`).
- **DOMAIN**: Domain and unit tests for parsers, spatial tree, and state stores (`npm test`).
- **UI**: Playwright browser tests for viewport interaction, toolbar, and panels (`npm run test:ui`).
- **FULL**: Complete multi-stage validation (`npm run lint && npm test && npm run build && npx playwright test`).
