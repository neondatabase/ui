/* oxlint-disable func-style, no-empty-function, no-shadow, no-use-before-define, react/react-compiler, max-lines-per-function, max-lines, no-magic-numbers -- vendored from chanhdai.com/r/elastic-slider.json (MIT, @iamncdai); kept diffable against upstream */
import * as React from "react";

// use-layout-effect.tsx
// https://github.com/radix-ui/primitives/blob/main/packages/react/use-layout-effect/src/use-layout-effect.tsx

/**
 * On the server, React emits a warning when calling `useLayoutEffect`.
 * This is because neither `useLayoutEffect` nor `useEffect` run on the server.
 * We use this safe version which suppresses the warning by replacing it with a noop on the server.
 *
 * See: https://reactjs.org/docs/hooks-reference.html#uselayouteffect
 */
const useLayoutEffect = globalThis?.document ? React.useLayoutEffect : () => {};

// use-controllable-state.tsx
// https://github.com/radix-ui/primitives/blob/main/packages/react/use-controllable-state/src/use-controllable-state.tsx

// Prevent bundlers from trying to optimize the import
const useInsertionEffect: typeof useLayoutEffect =
  (React as never)[" useInsertionEffect ".trim().toString()] || useLayoutEffect;

type ChangeHandler<T> = (state: T) => void;
type SetStateFn<T> = React.Dispatch<React.SetStateAction<T>>;

interface UseControllableStateParams<T> {
  prop?: T | undefined;
  defaultProp: T;
  onChange?: ChangeHandler<T>;
  caller?: string;
}

export function useControllableState<T>({
  prop,
  defaultProp,
  onChange = () => {},
  caller,
}: UseControllableStateParams<T>): [T, SetStateFn<T>] {
  const [uncontrolledProp, setUncontrolledProp, onChangeRef] =
    useUncontrolledState({
      defaultProp,
      onChange,
    });
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolledProp;

  // Hooks run unconditionally so Hook order never changes between renders;
  // only the dev-time warning itself is gated on the environment.
  // (Neon UI patch on the vendored source.)
  const isControlledRef = React.useRef(prop !== undefined);
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const wasControlled = isControlledRef.current;
      if (wasControlled !== isControlled) {
        const from = wasControlled ? "controlled" : "uncontrolled";
        const to = isControlled ? "controlled" : "uncontrolled";
        console.warn(
          `${caller} is changing from ${from} to ${to}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
        );
      }
    }
    isControlledRef.current = isControlled;
  }, [isControlled, caller]);

  const setValue = React.useCallback<SetStateFn<T>>(
    (nextValue) => {
      if (isControlled) {
        const value = isFunction(nextValue) ? nextValue(prop) : nextValue;
        if (value !== prop) {
          onChangeRef.current?.(value);
        }
      } else {
        // Notify the parent from the event handler instead of a useEffect,
        // per https://react.dev/learn/you-might-not-need-an-effect — saves
        // the extra render. (Neon UI patch on the vendored source.)
        const value = isFunction(nextValue)
          ? nextValue(uncontrolledProp)
          : nextValue;
        setUncontrolledProp(value);
        if (value !== uncontrolledProp) {
          onChangeRef.current?.(value);
        }
      }
    },
    [isControlled, prop, setUncontrolledProp, onChangeRef, uncontrolledProp]
  );

  return [value, setValue];
}

function useUncontrolledState<T>({
  defaultProp,
  onChange,
}: Omit<UseControllableStateParams<T>, "prop">): [
  Value: T,
  setValue: React.Dispatch<React.SetStateAction<T>>,
  OnChangeRef: React.RefObject<ChangeHandler<T> | undefined>,
] {
  const [value, setValue] = React.useState(defaultProp);

  const onChangeRef = React.useRef(onChange);
  useInsertionEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // onChange is fired from setValue in useControllableState rather than from
  // an effect here, so parents update in the same render pass.
  // (Neon UI patch on the vendored source.)
  return [value, setValue, onChangeRef];
}

function isFunction(value: unknown): value is (...args: never[]) => unknown {
  return typeof value === "function";
}
