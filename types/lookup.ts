export type ClothingDetailResponse = {
  garment_type_id: string;
  size: string;
};

export type PackageItemDetailResponse = {
  id: number;
  category_slug?: string;
  category_name: string;
  quantity: number;
  barcode?: string;
  item_name?: string;
  clothing_detail?: ClothingDetailResponse;
};

export type TripSummaryResponse = {
  id: number;
  truck_plate: string;
  driver_name: string;
  origin_camp: string;
  destination_camp: string;
  status: string;
  dispatched_at?: string;
};

export type ApiPackageResponse = {
  id_uuid: string;
  status: string;
  packer_name?: string;
  receiver_name?: string;
  updated_at: string;
  trip?: TripSummaryResponse;
  items: PackageItemDetailResponse[];
};
