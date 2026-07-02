import AsyncStorage from "@react-native-async-storage/async-storage";

const CENTRO_ACOPIO_ID_KEY = "@acopio/centro-acopio-id";
const CAMP_NAME_KEY = "@acopio/camp-name";

export async function loadCentroAcopioId(): Promise<string | null> {
  return AsyncStorage.getItem(CENTRO_ACOPIO_ID_KEY);
}

export async function saveCentroAcopioId(id: string): Promise<void> {
  const trimmed = id.trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(CENTRO_ACOPIO_ID_KEY);
    return;
  }
  await AsyncStorage.setItem(CENTRO_ACOPIO_ID_KEY, trimmed);
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
