import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import pkg from "./package.json";
import autoPreprocess from "svelte-preprocess";
import execute from "rollup-plugin-execute";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;

const name = pkg.name
  .replace(/^(@\S+\/)?(svelte-)?(\S+)/, "$3")
  .replace(/^\w/, (m) => m.toUpperCase())
  .replace(/-\w/g, (m) => m[1].toUpperCase());

export default {
  input: "src/index.ts",
  output: [
    { file: pkg.module, format: "es" },
    {
      file: pkg.main,
      format: "umd",
      name,
      sourcemap: !production,
      plugins: [
        // we only want to run this once, so we'll just make it part of this output's plugins
        execute([
          "tsc --outDir ./dist --declaration",
          "node scripts/preprocess.js",
        ]),
      ],
    },
  ],
  plugins: [
    svelte({
      preprocess: autoPreprocess(),
    }),
    typescript({ sourceMap: !production }),
    resolve(),
    production && terser(),
  ],
};
