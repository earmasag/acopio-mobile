import { useRef, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  type Edge,
} from "react-native-safe-area-context";

import { KeyboardFormProvider } from "@/components/keyboard/keyboard-form-context";
import {
  KEYBOARD_FORM_GAP,
  useKeyboardFormScroll,
} from "@/hooks/use-keyboard-form-scroll";

const DEFAULT_BASE_PADDING = 32;
const DEFAULT_KEYBOARD_OFFSET = Platform.OS === "ios" ? 16 : 0;

type KeyboardAwareScrollScreenProps = {
  children: ReactNode;
  scrollViewClassName?: string;
  contentContainerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  safeAreaClassName?: string;
  safeAreaEdges?: Edge[];
  basePaddingBottom?: number;
  keyboardGap?: number;
  keyboardVerticalOffset?: number;
  showsVerticalScrollIndicator?: boolean;
};

export function KeyboardAwareScrollScreen({
  children,
  scrollViewClassName = "flex-1",
  contentContainerClassName,
  contentContainerStyle,
  safeAreaClassName = "flex-1 bg-acopio-bg",
  safeAreaEdges = ["top", "left", "right"],
  basePaddingBottom = DEFAULT_BASE_PADDING,
  keyboardGap = KEYBOARD_FORM_GAP,
  keyboardVerticalOffset = DEFAULT_KEYBOARD_OFFSET,
  showsVerticalScrollIndicator = false,
}: KeyboardAwareScrollScreenProps) {
  const scrollRef = useRef<ScrollView>(null);
  const keyboard = useKeyboardFormScroll(scrollRef, keyboardGap);

  return (
    <SafeAreaView className={safeAreaClassName} edges={safeAreaEdges}>
      <KeyboardFormProvider
        value={{
          onInputFocus: keyboard.onFormInputFocus,
          dismissKeyboard: keyboard.dismissKeyboard,
          clearFormKeyboardState: keyboard.clearFormKeyboardState,
        }}
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <ScrollView
            ref={scrollRef}
            className={scrollViewClassName}
            contentContainerClassName={contentContainerClassName}
            contentContainerStyle={[
              contentContainerStyle,
              { paddingBottom: basePaddingBottom + keyboard.extraPadding },
            ]}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </KeyboardFormProvider>
    </SafeAreaView>
  );
}
