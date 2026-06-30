import { KeyboardAvoidingView, Platform } from "react-native";
import type { ReactNode } from "react";
import {
  SafeAreaView,
  type Edge,
} from "react-native-safe-area-context";

const DEFAULT_KEYBOARD_OFFSET = Platform.OS === "ios" ? 16 : 0;

type KeyboardAwareScreenProps = {
  children: ReactNode;
  className?: string;
  safeAreaEdges?: Edge[];
  keyboardVerticalOffset?: number;
};

/** Contenedor flex (sin scroll) que evita que el teclado tape inputs fijos. */
export function KeyboardAwareScreen({
  children,
  className = "flex-1 bg-acopio-bg",
  safeAreaEdges,
  keyboardVerticalOffset = DEFAULT_KEYBOARD_OFFSET,
}: KeyboardAwareScreenProps) {
  return (
    <SafeAreaView className={className} edges={safeAreaEdges}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
