/**
 * ESLint configuration for AB Data Hub Frontend
 */

module.exports = {
    extends: ['next/core-web-vitals'],
    rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        '@next/next/no-img-element': 'off',
        '@next/next/no-html-link-for-pages': 'off',
    },
    overrides: [{
        files: ['*.ts', '*.tsx'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    }, ],
}