import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: ['**/.next/**', '**/out/**', '**/node_modules/**'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default config;
