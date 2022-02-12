import { terser } from 'rollup-plugin-terser'
import sizeCheck from 'rollup-plugin-filesize-check'
import { nodeResolve } from '@rollup/plugin-node-resolve';

const opts = {
  keep_classnames: true,
  module: true,
}

export default [
  // === Main ==
  {
    input: 'src/index.js',
    output: [{ file: 'builds/de-compromise.js', format: 'umd', name: 'nlp' }],
    plugins: [nodeResolve(), terser(opts), sizeCheck({ expect: 180, warn: 15 })],
  },
  {
    input: 'src/index.js',
    output: [{ file: 'builds/de-compromise.mjs', format: 'esm' }],
    plugins: [nodeResolve(), terser(opts), sizeCheck({ expect: 180, warn: 15 })],
  }

]