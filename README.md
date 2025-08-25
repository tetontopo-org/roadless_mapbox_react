# Oregon Roadless Areas Map

An interactive web map showing Oregon's roadless areas, trails, and congressional districts. Built with React, TypeScript, and Mapbox GL JS.

## Features

- **Interactive Map**: Explore Oregon's roadless areas with detailed information
- **Search Functionality**: Search for cities, addresses, rivers, mountains, and other POIs using Mapbox's Geocoding API
- **Trail Information**: View Pacific Crest Trail and Oregon trails with detailed popups
- **Congressional Districts**: Click on districts to see representative information and roadless area statistics
- **3D Terrain**: Toggle between 2D and 3D terrain views
- **Responsive Design**: Works on desktop and mobile devices

## Search Feature

The search bar allows you to find and navigate to various points of interest:

- **Cities and Towns**: Search for Oregon cities like "Portland", "Eugene", "Bend"
- **Natural Features**: Find mountains, rivers, lakes, and parks
- **Addresses**: Search for specific addresses
- **Neighborhoods**: Discover local areas and communities

### How to Use Search

1. Click on the search bar in the top-left corner
2. Type your search query (e.g., "Mount Hood", "Willamette River", "Portland")
3. Select from the dropdown results
4. The map will automatically fly to the selected location

The search is optimized for Oregon and includes:

- Debounced input for better performance
- Keyboard navigation (arrow keys, Enter, Escape)
- Automatic zoom level adjustment based on result type
- Mobile-responsive design

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
