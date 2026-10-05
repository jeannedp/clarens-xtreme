"use server";

import { FiltersView } from "@/models/types/filters.view.types";
import { createAdminClient } from "@/utils/supabase/admin";

export interface DashboardFilters {
  devices: {
    value: string;
    label: string;
  }[];
  deviceTypes: {
    value: string;
    label: string;
  }[];
  readers: {
    value: string;
    label: string;
    settingId: string | null;
  }[];
  dates:{
    min: Date;
    max: Date;
  };
}

export async function getFilters(): Promise<DashboardFilters> {
  const supabase = createAdminClient();

  const { data: filters, error } = await supabase
    .from("filters")
    .select('*')
    .maybeSingle()
    .overrideTypes<FiltersView>();

  if (!filters) {
    return {
      devices: [],
      deviceTypes: [],
      readers: [],
      dates: {
        min: new Date(),
        max: new Date(),
      },
    }
  }
  
  return {
    devices: filters.devices.map((d) => ({ value: d.id, label: d.name })),
    deviceTypes: filters.device_types.map((dt) => ({ value: dt.id, label: dt.name })),
    readers: filters.readers.map((r) => ({ value: r.id, label: r.name, settingId: r.setting_id })),
    dates: {
      min: filters.dates?.min ? new Date(filters!.dates.min) : new Date(),
      max: filters.dates?.max ? new Date(filters!.dates.max) : new Date(),
    }
  };
}
