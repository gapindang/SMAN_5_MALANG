import tseslint from 'typescript-eslint';
export default tseslint.config({ignores:['dist/**','.astro/**','.vercel/**','node_modules/**']},...tseslint.configs.recommended,{files:['**/*.ts'],rules:{'@typescript-eslint/no-explicit-any':'off'}});
