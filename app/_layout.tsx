import "../global.css";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useEffect } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { startSyncEngine, stopSyncEngine } from "@/lib/sync-engine";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    startSyncEngine();
    return () => {
      stopSyncEngine();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
