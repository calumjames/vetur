import * as path from 'path';

export const enum State {
  Loaded,
  Unloaded
}

export interface UnloadedDependency {
  name: string;
  state: State.Unloaded;
}

export interface LoadedDependency<T> {
  name: string;
  state: State.Loaded;
  version: string;
  bundled: boolean;
  module: T;
}

export type RuntimeDependency<T> = LoadedDependency<T> | UnloadedDependency;

export type T_PrettyHtml = typeof import('@starptech/prettyhtml');
export type T_ESLint = typeof import('eslint');
export type T_ESLintPluginVue = typeof import('eslint-plugin-vue');
export type T_JSBeautify = typeof import('eslint-plugin-vue');
export type T_Prettier = typeof import('prettier');
// export type T_PrettierEslint = typeof import('prettier-eslint');
export type T_StylusSupremacy = typeof import('stylus-supremacy');
export type T_TypeScript = typeof import('typescript');

interface VLSDependencies {
  prettyhtml: RuntimeDependency<T_PrettyHtml>;
  eslint: RuntimeDependency<T_ESLint>;
  eslintPluginVue: RuntimeDependency<T_ESLintPluginVue>;
  jsbeautify: RuntimeDependency<T_JSBeautify>;
  prettier: RuntimeDependency<T_Prettier>;
  // prettierEslint: RuntimeDependency<T_PrettierEslint>;
  stylusSupremacy: RuntimeDependency<T_StylusSupremacy>;
  typescript: RuntimeDependency<T_TypeScript>;
}

type ValueOf<T> = T[keyof T];

export class DependencyService {
  private dependencies: VLSDependencies = {
    prettyhtml: { name: 'prettyhtml', state: State.Unloaded },
    eslint: { name: 'eslint', state: State.Unloaded },
    eslintPluginVue: { name: 'eslint-plugin-vue', state: State.Unloaded },
    jsbeautify: { name: 'js-beautify', state: State.Unloaded },
    prettier: { name: 'prettier', state: State.Unloaded },
    // prettierEslint: { name: 'prettier-eslint', state: State.Unloaded },
    stylusSupremacy: { name: 'stylus-supremacy', state: State.Unloaded },
    typescript: { name: 'typescript', state: State.Unloaded }
  };

  constructor() {}

  async init(workspacePath: string) {
    const workspaceTSPath = path.resolve(workspacePath, 'node_modules/typescript');
    const tsModule: T_TypeScript = await import(workspaceTSPath);

    this.dependencies.typescript = {
      name: 'typecript',
      state: State.Loaded,
      version: '1.0.0',
      bundled: true,
      module: tsModule
    };
  }

  getDependency(d: keyof VLSDependencies): ValueOf<VLSDependencies> | undefined {
    if (!this.dependencies[d]) {
      return undefined;
    }

    return this.dependencies[d];
  }
}
