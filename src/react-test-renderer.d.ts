// Déclaration locale de `react-test-renderer`, faute de `@types/...`.
//
// Le paquet lui-même est présent dans node_modules (jest-expo le tire), mais
// ses types ne le sont pas, et `npm i -D @types/react-test-renderer` échoue
// sur un conflit de peer dependencies. Forcer l'installation pour typer un
// fichier de test reviendrait à toucher l'arbre de dépendances de l'app pour
// le confort d'un outil : on déclare donc ici la seule surface utilisée.
//
// À supprimer le jour où les types s'installent proprement.
declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';

  export type ReactTestInstance = {
    type: string | (new (...args: never[]) => unknown) | ((...args: never[]) => unknown);
    // Les props d'un nœud rendu : leur forme dépend du composant inspecté,
    // d'où l'indexation libre. Le test les restreint au cas par cas.
    props: Record<string, any>;
    parent: ReactTestInstance | null;
    children: (ReactTestInstance | string)[];
    find(predicate: (node: ReactTestInstance) => boolean): ReactTestInstance;
    findAll(
      predicate: (node: ReactTestInstance) => boolean,
      options?: { deep?: boolean }
    ): ReactTestInstance[];
    findByType(type: unknown): ReactTestInstance;
    findAllByType(type: unknown, options?: { deep?: boolean }): ReactTestInstance[];
    findByProps(props: Record<string, unknown>): ReactTestInstance;
    findAllByProps(props: Record<string, unknown>): ReactTestInstance[];
  };

  export type ReactTestRenderer = {
    root: ReactTestInstance;
    toJSON(): unknown;
    toTree(): unknown;
    update(element: ReactElement): void;
    unmount(): void;
  };

  export function create(
    element: ReactElement,
    options?: Record<string, unknown>
  ): ReactTestRenderer;

  export function act(callback: () => void | Promise<void>): void;

  const _default: {
    create: typeof create;
    act: typeof act;
    ReactTestRenderer: ReactTestRenderer;
  };
  export default _default;
}
