import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'src/generated/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // В тестах разбирается произвольный JSON ответа, типизировать его нет смысла.
  { files: ['test/**/*.ts'], rules: { '@typescript-eslint/no-explicit-any': 'off' } },
);
