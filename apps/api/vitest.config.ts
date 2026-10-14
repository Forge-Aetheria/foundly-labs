import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const tsconfigPath = fileURLToPath(new URL('./tsconfig.json', import.meta.url));

function readCompilerOptions(): ts.CompilerOptions {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
  }

  return ts.parseJsonConfigFileContent(configFile.config, ts.sys, rootDir).options;
}

const compilerOptions = readCompilerOptions();

/**
 * Transforms TypeScript through the pure-JS TypeScript compiler instead of the
 * native SWC addon. Some Windows hosts enforce an Application Control (WDAC)
 * policy that refuses to load the unsigned `@swc/core` binary, which previously
 * made the whole suite unrunnable locally. The TypeScript compiler needs no
 * native binaries and still honors `experimentalDecorators` /
 * `emitDecoratorMetadata`, so NestJS dependency injection keeps working.
 */
function typescriptTransform(): Plugin {
  return {
    name: 'foundly:typescript-transform',
    enforce: 'pre',
    transform(code, id) {
      const [file] = id.split('?');
      if (!file || !/\.[cm]?tsx?$/.test(file)) {
        return null;
      }

      const { outputText, sourceMapText } = ts.transpileModule(code, {
        fileName: file,
        compilerOptions: {
          ...compilerOptions,
          // Emit ESM for Vite's SSR/Vitest runtime instead of the app's CJS build.
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          target: ts.ScriptTarget.ES2022,
          noEmit: false,
          declaration: false,
          declarationMap: false,
          sourceMap: true,
          inlineSources: true,
        },
        reportDiagnostics: false,
      });

      return {
        code: outputText,
        map: sourceMapText ? JSON.parse(sourceMapText) : null,
      };
    },
  };
}

export default defineConfig({
  plugins: [typescriptTransform()],
  esbuild: false,
  test: {
    environment: 'node',
    globals: false,
  },
});
