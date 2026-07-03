import type { Href } from "expo-router";
import type { ComponentProps } from "react";
import type { MaterialIcons } from "@expo/vector-icons";

export type OperationMode = "pack" | "load" | "receive" | "lookup";

export const ROLES: {
  id: OperationMode;
  title: string;
  description: string;
  route: Href;
  icon: ComponentProps<typeof MaterialIcons>["name"];
  cardClass: string;
  iconClass: string;
  step: string;
}[] = [
  {
    id: "pack",
    title: "Empaquetado",
    description: "Registrar contenido de cajas en origen",
    route: "/pack",
    icon: "inventory-2",
    step: "Voluntario A",
    cardClass: "border-emerald-200 bg-white",
    iconClass: "bg-emerald-700",
  },
  {
    id: "load",
    title: "Carga",
    description: "Asignar cajas al camión",
    route: "/load",
    icon: "local-shipping",
    step: "Voluntario B",
    cardClass: "border-sky-200 bg-white",
    iconClass: "bg-sky-700",
  },
  {
    id: "receive",
    title: "Recepción",
    description: "Confirmar llegada en destino",
    route: "/receive",
    icon: "check-circle-outline",
    step: "Destino",
    cardClass: "border-amber-200 bg-white",
    iconClass: "bg-amber-600",
  },
  {
    id: "lookup",
    title: "Consultar Caja",
    description: "Ver detalles y contenido escaneando el QR",
    route: "/lookup/scan",
    icon: "search",
    step: "Cualquiera",
    cardClass: "border-purple-200 bg-white",
    iconClass: "bg-purple-600",
  },
];
