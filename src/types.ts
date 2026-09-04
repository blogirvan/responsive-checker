export type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'responsive' | 'custom';

export interface DeviceDefinition {
  id: DeviceType;
  name: string;
  width: number | string;
  height: number | string;
  icon: any; // We'll pass Lucide component here
}
