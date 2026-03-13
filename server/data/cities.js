export const cityCatalog = {
  'new-delhi': {
    id: 'new-delhi',
    name: 'New Delhi',
    state: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    floodSensitivity: 44,
    baseline: { temperature: 32.8, humidity: 34, wind: 11.4, rain: 0.2, pm25: 68 },
  },
  mumbai: {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.076,
    longitude: 72.8777,
    floodSensitivity: 81,
    baseline: { temperature: 30.1, humidity: 70, wind: 17.8, rain: 2.1, pm25: 32 },
  },
  bengaluru: {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    floodSensitivity: 58,
    baseline: { temperature: 26.4, humidity: 56, wind: 9.7, rain: 1.3, pm25: 21 },
  },
  kolkata: {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.5726,
    longitude: 88.3639,
    floodSensitivity: 82,
    baseline: { temperature: 31.2, humidity: 68, wind: 13.2, rain: 2.8, pm25: 44 },
  },
  chennai: {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.0827,
    longitude: 80.2707,
    floodSensitivity: 70,
    baseline: { temperature: 32.1, humidity: 67, wind: 18.6, rain: 0.8, pm25: 29 },
  },
  guwahati: {
    id: 'guwahati',
    name: 'Guwahati',
    state: 'Assam',
    latitude: 26.1445,
    longitude: 91.7362,
    floodSensitivity: 87,
    baseline: { temperature: 28.2, humidity: 74, wind: 8.3, rain: 7.6, pm25: 25 },
  },
  jaipur: {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.9124,
    longitude: 75.7873,
    floodSensitivity: 31,
    baseline: { temperature: 34.5, humidity: 26, wind: 15.1, rain: 0.1, pm25: 51 },
  },
}

export function getCityById(cityId) {
  return cityCatalog[cityId] ?? null
}
