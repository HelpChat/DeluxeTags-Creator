import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'static'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      // The dynamic YAML and config boundary uses any in a few typed-port spots; warn, do not block.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
