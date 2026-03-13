import type { AdministrativeOverlay } from '../types/climate'

export const stateOverlays: AdministrativeOverlay[] = [
  {
    id: 'state-delhi',
    name: 'Delhi',
    level: 'state',
    stateId: 'delhi',
    coordinates: [
      [28.95, 76.82],
      [28.95, 77.55],
      [28.36, 77.55],
      [28.36, 76.82],
    ],
    metrics: { heat: 84, flood: 42, air: 88 },
  },
  {
    id: 'state-maharashtra',
    name: 'Maharashtra',
    level: 'state',
    stateId: 'maharashtra',
    coordinates: [
      [22.05, 72.55],
      [22.05, 80.95],
      [15.6, 80.95],
      [15.6, 72.55],
    ],
    metrics: { heat: 64, flood: 73, air: 46 },
  },
  {
    id: 'state-karnataka',
    name: 'Karnataka',
    level: 'state',
    stateId: 'karnataka',
    coordinates: [
      [18.65, 74.05],
      [18.65, 78.85],
      [11.55, 78.85],
      [11.55, 74.05],
    ],
    metrics: { heat: 52, flood: 55, air: 34 },
  },
  {
    id: 'state-west-bengal',
    name: 'West Bengal',
    level: 'state',
    stateId: 'west-bengal',
    coordinates: [
      [27.85, 85.7],
      [27.85, 89.95],
      [21.4, 89.95],
      [21.4, 85.7],
    ],
    metrics: { heat: 58, flood: 78, air: 62 },
  },
  {
    id: 'state-tamil-nadu',
    name: 'Tamil Nadu',
    level: 'state',
    stateId: 'tamil-nadu',
    coordinates: [
      [13.95, 76.15],
      [13.95, 80.9],
      [8.0, 80.9],
      [8.0, 76.15],
    ],
    metrics: { heat: 74, flood: 67, air: 41 },
  },
  {
    id: 'state-assam',
    name: 'Assam',
    level: 'state',
    stateId: 'assam',
    coordinates: [
      [27.95, 89.55],
      [27.95, 96.15],
      [24.05, 96.15],
      [24.05, 89.55],
    ],
    metrics: { heat: 45, flood: 83, air: 38 },
  },
  {
    id: 'state-rajasthan',
    name: 'Rajasthan',
    level: 'state',
    stateId: 'rajasthan',
    coordinates: [
      [30.85, 69.45],
      [30.85, 78.45],
      [23.05, 78.45],
      [23.05, 69.45],
    ],
    metrics: { heat: 89, flood: 26, air: 67 },
  },
]

export const districtOverlays: AdministrativeOverlay[] = [
  {
    id: 'district-new-delhi',
    name: 'New Delhi District',
    level: 'district',
    stateId: 'delhi',
    cityId: 'new-delhi',
    coordinates: [
      [28.76, 77.03],
      [28.76, 77.32],
      [28.49, 77.32],
      [28.49, 77.03],
    ],
    metrics: { heat: 86, flood: 44, air: 91 },
  },
  {
    id: 'district-mumbai-city',
    name: 'Mumbai City District',
    level: 'district',
    stateId: 'maharashtra',
    cityId: 'mumbai',
    coordinates: [
      [19.29, 72.74],
      [19.29, 72.99],
      [18.87, 72.99],
      [18.87, 72.74],
    ],
    metrics: { heat: 66, flood: 80, air: 53 },
  },
  {
    id: 'district-bengaluru-urban',
    name: 'Bengaluru Urban District',
    level: 'district',
    stateId: 'karnataka',
    cityId: 'bengaluru',
    coordinates: [
      [13.18, 77.39],
      [13.18, 77.79],
      [12.77, 77.79],
      [12.77, 77.39],
    ],
    metrics: { heat: 50, flood: 58, air: 36 },
  },
  {
    id: 'district-kolkata',
    name: 'Kolkata District',
    level: 'district',
    stateId: 'west-bengal',
    cityId: 'kolkata',
    coordinates: [
      [22.72, 88.18],
      [22.72, 88.53],
      [22.4, 88.53],
      [22.4, 88.18],
    ],
    metrics: { heat: 62, flood: 81, air: 64 },
  },
  {
    id: 'district-chennai',
    name: 'Chennai District',
    level: 'district',
    stateId: 'tamil-nadu',
    cityId: 'chennai',
    coordinates: [
      [13.27, 80.08],
      [13.27, 80.37],
      [12.95, 80.37],
      [12.95, 80.08],
    ],
    metrics: { heat: 77, flood: 69, air: 43 },
  },
  {
    id: 'district-kamrup-metro',
    name: 'Kamrup Metropolitan',
    level: 'district',
    stateId: 'assam',
    cityId: 'guwahati',
    coordinates: [
      [26.25, 91.55],
      [26.25, 91.91],
      [26.01, 91.91],
      [26.01, 91.55],
    ],
    metrics: { heat: 48, flood: 86, air: 40 },
  },
  {
    id: 'district-jaipur',
    name: 'Jaipur District',
    level: 'district',
    stateId: 'rajasthan',
    cityId: 'jaipur',
    coordinates: [
      [27.09, 75.59],
      [27.09, 76.03],
      [26.72, 76.03],
      [26.72, 75.59],
    ],
    metrics: { heat: 90, flood: 30, air: 70 },
  },
]

export function findDistrictOverlayByCityId(
  cityId: string,
): AdministrativeOverlay | null {
  return districtOverlays.find((district) => district.cityId === cityId) ?? null
}
