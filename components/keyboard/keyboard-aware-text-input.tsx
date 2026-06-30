import { TextInput, type TextInputProps } from "react-native";

import { useKeyboardInputFocus } from "@/components/keyboard/keyboard-form-context";

export function KeyboardAwareTextInput(props: TextInputProps) {
  const handleFocus = useKeyboardInputFocus(props.onFocus);

  return <TextInput {...props} onFocus={handleFocus} />;
}
