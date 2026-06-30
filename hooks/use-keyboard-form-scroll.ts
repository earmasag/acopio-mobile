import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Keyboard,
  Platform,
  type ScrollView,
} from "react-native";

/** Espacio extra bajo el formulario mientras el teclado está visible. */
export const KEYBOARD_FORM_GAP = 32;

export function useKeyboardFormScroll(
  scrollRef: RefObject<ScrollView | null>,
  gap = KEYBOARD_FORM_GAP,
) {
  const [extraPadding, setExtraPadding] = useState(0);
  const formFieldFocusedRef = useRef(false);
  const scrollTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearScrollTimers = useCallback(() => {
    scrollTimersRef.current.forEach(clearTimeout);
    scrollTimersRef.current = [];
  }, []);

  const scrollToEnd = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [scrollRef]);

  const scheduleFormScroll = useCallback(() => {
    if (!formFieldFocusedRef.current) return;

    clearScrollTimers();
    scrollToEnd();
    for (const delay of [80, 180, 320]) {
      scrollTimersRef.current.push(setTimeout(scrollToEnd, delay));
    }
  }, [clearScrollTimers, scrollToEnd]);

  const applyFormPadding = useCallback(
    (open: boolean) => {
      if (!formFieldFocusedRef.current) {
        setExtraPadding(0);
        return;
      }
      setExtraPadding(open ? gap : 0);
    },
    [gap],
  );

  const onFormInputFocus = useCallback(() => {
    formFieldFocusedRef.current = true;
    scheduleFormScroll();
  }, [scheduleFormScroll]);

  const dismissKeyboard = useCallback(() => {
    formFieldFocusedRef.current = false;
    setExtraPadding(0);
    Keyboard.dismiss();
  }, []);

  const clearFormKeyboardState = useCallback(() => {
    formFieldFocusedRef.current = false;
    setExtraPadding(0);
  }, []);

  useEffect(() => {
    const onShow = () => {
      if (!formFieldFocusedRef.current) return;
      applyFormPadding(true);
      scheduleFormScroll();
    };

    const onHide = () => {
      const verify = () => {
        if (typeof Keyboard.isVisible === "function" && Keyboard.isVisible()) {
          return;
        }
        formFieldFocusedRef.current = false;
        setExtraPadding(0);
      };

      if (Platform.OS === "ios") {
        setTimeout(verify, 60);
      } else {
        verify();
      }
    };

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subscriptions = [
      Keyboard.addListener(showEvent, onShow),
      Keyboard.addListener(hideEvent, onHide),
    ];

    if (Platform.OS === "ios") {
      subscriptions.push(
        Keyboard.addListener("keyboardWillChangeFrame", (event) => {
          if (!formFieldFocusedRef.current) return;

          const isVisible = event.endCoordinates.height > 0;
          if (isVisible) {
            applyFormPadding(true);
            scheduleFormScroll();
            return;
          }
          onHide();
        }),
      );
    }

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      clearScrollTimers();
    };
  }, [applyFormPadding, clearScrollTimers, scheduleFormScroll]);

  return {
    extraPadding,
    onFormInputFocus,
    dismissKeyboard,
    clearFormKeyboardState,
  };
}
