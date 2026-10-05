export interface FiltersView {
  devices: {
    id: string;
    name: string;
  }[];
  device_types: {
    id: string;
    name: string;
  }[];
  readers: {
    id: string;
    name: string;
    setting_id: string | null;
  }[];
  dates:{
    min: string;
    max: string;
  };
}
