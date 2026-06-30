export type GarmentTypeId =
  | "camisa"
  | "pantalon"
  | "short"
  | "falda"
  | "vestido"
  | "chaqueta"
  | "calzado"
  | "ropa_interior"
  | "otro";

export const GARMENT_TYPES = [
  { id: "camisa", label: "Camisa" },
  { id: "pantalon", label: "Pantalón" },
  { id: "short", label: "Short" },
  { id: "falda", label: "Falda" },
  { id: "vestido", label: "Vestido" },
  { id: "chaqueta", label: "Chaqueta / abrigo" },
  { id: "calzado", label: "Calzado" },
  { id: "ropa_interior", label: "Ropa interior" },
  { id: "otro", label: "Otra" },
] as const satisfies ReadonlyArray<{ id: GarmentTypeId; label: string }>;

export const GARMENT_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2XL",
  "Única",
] as const;

export type GarmentSize = (typeof GARMENT_SIZES)[number];

export function getGarmentLabel(id: GarmentTypeId | string): string {
  return GARMENT_TYPES.find((garment) => garment.id === id)?.label ?? id;
}

export function usesNumericShoeSize(garmentType: GarmentTypeId): boolean {
  return garmentType === "calzado";
}

export function isValidShoeSize(size: string): boolean {
  const trimmed = size.trim();
  return trimmed.length > 0 && /^\d+$/.test(trimmed);
}
