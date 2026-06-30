import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { CATEGORIES, type CategoryId } from "@/constants/categories";
import {
  GARMENT_SIZES,
  GARMENT_TYPES,
  getGarmentLabel,
  isValidShoeSize,
  usesNumericShoeSize,
  type GarmentTypeId,
} from "@/constants/clothing";
import { QuantityInput } from "@/components/pack/quantity-input";
import type { ManualItemInput } from "@/types/pack";

type AddManualItemFormProps = {
  onAdd: (input: ManualItemInput) => void;
  onInputFocus?: () => void;
  onDismissKeyboard?: () => void;
};

export function AddManualItemForm({
  onAdd,
  onInputFocus,
  onDismissKeyboard,
}: AddManualItemFormProps) {
  const [categoryId, setCategoryId] = useState<CategoryId>("medicamentos");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [garmentType, setGarmentType] = useState<GarmentTypeId>("camisa");
  const [customGarment, setCustomGarment] = useState("");
  const [size, setSize] = useState<string>("M");
  const [error, setError] = useState<string | null>(null);

  const isClothing = categoryId === "ropa";
  const isShoeSize = isClothing && usesNumericShoeSize(garmentType);

  function resetClothingFields() {
    setGarmentType("camisa");
    setCustomGarment("");
    setSize("M");
  }

  function handleGarmentTypeChange(nextGarment: GarmentTypeId) {
    onDismissKeyboard?.();
    setGarmentType(nextGarment);
    if (usesNumericShoeSize(nextGarment)) {
      setSize("");
    } else if (usesNumericShoeSize(garmentType)) {
      setSize("M");
    }
    if (error) setError(null);
  }

  function handleCategoryChange(nextCategory: CategoryId) {
    onDismissKeyboard?.();
    setCategoryId(nextCategory);
    setError(null);
    if (nextCategory !== "ropa") {
      resetClothingFields();
    }
  }

  function buildClothingName(): string | null {
    const prendaLabel =
      garmentType === "otro"
        ? customGarment.trim()
        : getGarmentLabel(garmentType);

    if (!prendaLabel) return null;

    const normalizedSize = size.trim();
    if (!normalizedSize) return null;
    if (usesNumericShoeSize(garmentType) && !isValidShoeSize(normalizedSize)) {
      return null;
    }

    return `${prendaLabel} · ${normalizedSize}`;
  }

  function handleAdd() {
    if (isClothing) {
      if (usesNumericShoeSize(garmentType) && !isValidShoeSize(size)) {
        setError("Ingresa el talle numérico del calzado");
        return;
      }

      const clothingName = buildClothingName();
      if (!clothingName) {
        setError(
          garmentType === "otro"
            ? "Ingresa la prenda y selecciona una talla"
            : isShoeSize
              ? "Selecciona calzado e ingresa el talle"
              : "Selecciona prenda y talla",
        );
        return;
      }

      setError(null);
      onAdd({
        categoryId,
        name: clothingName,
        quantity,
        garmentType,
        size: size.trim(),
      });
      resetClothingFields();
      setQuantity(1);
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Ingresa el nombre del artículo");
      return;
    }

    setError(null);
    onAdd({ categoryId, name: trimmedName, quantity });
    setName("");
    setQuantity(1);
  }

  return (
    <View className="rounded-2xl border border-emerald-200 bg-white p-4">
      <Text className="mb-1 text-sm font-semibold uppercase tracking-wide text-acopio-muted">
        Agregar manualmente
      </Text>
      <Text className="mb-4 text-sm text-acopio-muted">
        {isClothing
          ? "Selecciona prenda, talla y cantidad"
          : "Selecciona una categoría e ingresa el artículo"}
      </Text>

      <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">
        Categoría
      </Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const selected = category.id === categoryId;
          return (
            <Pressable
              key={category.id}
              className={`rounded-full border px-3 py-2 ${
                selected
                  ? "border-emerald-700 bg-emerald-700"
                  : "border-emerald-200 bg-acopio-bg"
              }`}
              onPress={() => handleCategoryChange(category.id)}
            >
              <Text
                className={`text-sm font-medium ${
                  selected ? "text-white" : "text-acopio-text"
                }`}
              >
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isClothing ? (
        <>
          <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">
            Prenda
          </Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {GARMENT_TYPES.map((garment) => {
              const selected = garment.id === garmentType;
              return (
                <Pressable
                  key={garment.id}
                  className={`rounded-full border px-3 py-2 ${
                    selected
                      ? "border-emerald-700 bg-emerald-700"
                      : "border-emerald-200 bg-acopio-bg"
                  }`}
                  onPress={() => handleGarmentTypeChange(garment.id)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selected ? "text-white" : "text-acopio-text"
                    }`}
                  >
                    {garment.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {garmentType === "otro" && (
            <>
              <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">
                Nombre de la prenda
              </Text>
              <TextInput
                className="mb-4 rounded-xl border border-gray-200 bg-acopio-bg px-4 py-3 text-base text-acopio-text"
                placeholder="Ej. Buzo polar"
                value={customGarment}
                onChangeText={(value) => {
                  setCustomGarment(value);
                  if (error) setError(null);
                }}
                onFocus={onInputFocus}
                autoCapitalize="sentences"
              />
            </>
          )}

          <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">
            {isShoeSize ? "Talle" : "Talla"}
          </Text>
          {isShoeSize ? (
            <TextInput
              className="mb-4 rounded-xl border border-gray-200 bg-acopio-bg px-4 py-3 text-base text-acopio-text"
              placeholder="Ej. 42"
              value={size}
              onChangeText={(value) => {
                setSize(value.replace(/[^\d]/g, ""));
                if (error) setError(null);
              }}
              onFocus={onInputFocus}
              keyboardType="number-pad"
              maxLength={2}
              returnKeyType="done"
            />
          ) : (
            <View className="mb-4 flex-row flex-wrap gap-2">
              {GARMENT_SIZES.map((garmentSize) => {
                const selected = garmentSize === size;
                return (
                  <Pressable
                    key={garmentSize}
                    className={`min-w-11 items-center rounded-full border px-3 py-2 ${
                      selected
                        ? "border-emerald-700 bg-emerald-700"
                        : "border-emerald-200 bg-acopio-bg"
                    }`}
                    onPress={() => {
                      setSize(garmentSize);
                      if (error) setError(null);
                    }}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selected ? "text-white" : "text-acopio-text"
                      }`}
                    >
                      {garmentSize}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      ) : (
        <>
          <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">
            Artículo
          </Text>
          <TextInput
            className="mb-4 rounded-xl border border-gray-200 bg-acopio-bg px-4 py-3 text-base text-acopio-text"
            placeholder="Ej. Paracetamol 500 mg"
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (error) setError(null);
            }}
            onFocus={onInputFocus}
            autoCapitalize="sentences"
          />
        </>
      )}

      <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">
        Cantidad
      </Text>
      <View className="mb-4">
        <QuantityInput
          value={quantity}
          onChange={setQuantity}
          onFocus={onInputFocus}
        />
      </View>

      {error && <Text className="mb-3 text-sm text-red-700">{error}</Text>}

      <Pressable
        className="flex-row items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 active:opacity-90"
        onPress={handleAdd}
      >
        <MaterialIcons name="playlist-add" size={20} color="#FFFFFF" />
        <Text className="font-semibold text-white">Agregar al paquete</Text>
      </Pressable>
    </View>
  );
}
