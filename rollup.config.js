import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import dts from 'rollup-plugin-dts'
import terser from '@rollup/plugin-terser'

const jsConfig = {
  input: 'src/core/index.ts',
  output: [
    {
      file: 'dist/index.esm.js',
      format: 'es'
    },
    {
      file: 'dist/index.cjs.js',
      format: 'cjs'
    },
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'Typewrite'
    },
    {
      file: 'dist/index.esm.min.js',
      format: 'es',
      plugins: [terser()]
    },
    {
      file: 'dist/index.cjs.min.js',
      format: 'cjs',
      plugins: [terser()]
    },
    {
      file: 'dist/index.umd.min.js',
      format: 'umd',
      name: 'Typewrite',
      plugins: [terser()]
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
  ],
  external: []
}

const dtsConfig = {
  input: 'src/core/index.ts',
  output: {
    file: 'dist/index.d.ts',
    format: 'es'
  },
  plugins: [dts()]
}
export default [jsConfig, dtsConfig]
