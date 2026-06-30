import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { useKeyboardForm } from "@/components/keyboard";

type QuantityInputProps = {
  value: number;
  onChange: (value: number) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  min?: number;
  compact?: boolean;
  /** Registra el foco como campo del formulario inferior (scroll automático). */
  formField?: boolean;
};

export function QuantityInput({
  value,
  onChange,
  onFocus,
  onBlur,
  min = 1,
  compact = false,
  formField = false,
}: QuantityInputProps) {
  const { onInputFocus, clearFormKeyboardState } = useKeyboardForm();
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commitDraft() {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isFinite(parsed) && parsed >= min) {
      onChange(parsed);
    } else {
      setDraft(String(value));
    }
  }

  function handleBlur() {
    commitDraft();
    onBlur?.();
  }

  const handleFocus = useCallback(() => {
    if (formField) {
      onInputFocus();
    } else {
      clearFormKeyboardState();
    }
    onFocus?.();
  }, [clearFormKeyboardState, formField, onFocus, onInputFocus]);

  const buttonClass = compact
    ? "h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-white"
    : "h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-acopio-bg";

  const inputClass = compact
    ? "min-w-10 rounded-lg border border-emerald-300 bg-white px-2 py-1 text-center text-base font-semibold text-acopio-text"
    : "min-w-12 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-center text-lg font-semibold text-acopio-text";

  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        className={buttonClass}
        onPress={() => onChange(Math.max(min, value - 1))}
      >
        <Text className="text-lg font-semibold text-acopio-accent">−</Text>
      </Pressable>

      <TextInput
        className={inputClass}
        keyboardType="number-pad"
        value={draft}
        onChangeText={setDraft}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={commitDraft}
        selectTextOnFocus
        maxLength={4}
        returnKeyType="done"
      />

      <Pressable className={buttonClass} onPress={() => onChange(value + 1)}>
        <Text className="text-lg font-semibold text-acopio-accent">+</Text>
      </Pressable>
    </View>
  );
}
