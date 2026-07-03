import AsyncStorage from "@react-native-async-storage/async-storage";

const CENTER_CODE_KEY = "@acopio/center-code";
const CAMP_NAME_KEY = "@acopio/camp-name";

export async function loadCenterCode(): Promise<string | null> {
  return AsyncStorage.getItem(CENTER_CODE_KEY);
}

export async function saveCenterCode(code: string): Promise<void> {
  const trimmed = code.trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(CENTER_CODE_KEY);
    return;
  }
  await AsyncStorage.setItem(CENTER_CODE_KEY, trimmed);
}

export async function loadCampName(): Promise<string | null> {
  return AsyncStorage.getItem(CAMP_NAME_KEY);
}

export async function saveCampName(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(CAMP_NAME_KEY);
    return;
  }
  await AsyncStorage.setItem(CAMP_NAME_KEY, trimmed);
}

