export type CategoryId =
  | "medicamentos"
  | "insumos_medicos"
  | "comida"
  | "bebida"
  | "ropa"
  | "juguetes";

export const CATEGORIES = [
  { id: "medicamentos", label: "Medicamentos" },
  { id: "insumos_medicos", label: "Insumos médicos" },
  { id: "comida", label: "Comida" },
  { id: "bebida", label: "Bebida" },
  { id: "ropa", label: "Ropa" },
  { id: "juguetes", label: "Juguetes" },
] as const;

export function getCategoryLabel(id: CategoryId): string {
  return CATEGORIES.find((category) => category.id === id)?.label ?? id;
}
