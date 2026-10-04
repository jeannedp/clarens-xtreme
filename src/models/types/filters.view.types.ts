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
  }[];
  dates:{
    min: string;
    max: string;
  };
}
