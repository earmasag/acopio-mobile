import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";
import type { TextInputProps } from "react-native";

export type KeyboardFormContextValue = {
  onInputFocus: () => void;
  dismissKeyboard: () => void;
  clearFormKeyboardState: () => void;
};

const noop = () => {};

const defaultValue: KeyboardFormContextValue = {
  onInputFocus: noop,
  dismissKeyboard: noop,
  clearFormKeyboardState: noop,
};

const KeyboardFormContext = createContext<KeyboardFormContextValue>(defaultValue);

export function KeyboardFormProvider({
  value,
  children,
}: {
  value: KeyboardFormContextValue;
  children: ReactNode;
}) {
  return (
    <KeyboardFormContext.Provider value={value}>
      {children}
    </KeyboardFormContext.Provider>
  );
}

export function useKeyboardForm(): KeyboardFormContextValue {
  return useContext(KeyboardFormContext);
}

/** Combina el foco del contexto con un callback opcional del componente. */
export function useKeyboardInputFocus(
  externalOnFocus?: TextInputProps["onFocus"],
) {
  const { onInputFocus } = useKeyboardForm();

  return useCallback(
    (event: Parameters<NonNullable<TextInputProps["onFocus"]>>[0]) => {
      onInputFocus();
      externalOnFocus?.(event);
    },
    [externalOnFocus, onInputFocus],
  );
}
