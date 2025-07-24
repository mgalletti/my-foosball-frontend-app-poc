# Matrial UI 
## Migrating deprecated features

source: [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/)

Material UI provides the deprecations/all codemod to help you stay up to date with minimal effort.

```bash
npx @mui/codemod@latest deprecations/all <path>
```

This command runs all the current deprecations codemods, automatically migrating to the updated API. You can run this codemod as often as necessary to keep up with the latest changes.

> **ℹ️ Info:**
>
> If you need to manually migrate from a deprecated API, you can find examples below for all deprecations that have been added in Material UI v5. If you need to run a specific codemod, those are also linked below.


# Development Template Information

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
