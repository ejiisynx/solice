import SunCalc from 'suncalc';

export interface SolarTimes {
  sunrise: Date;
  sunset: Date;
  goldenHour: Date;
  goldenHourEnd: Date;
}

export function getSolarTimes(date: Date, lat: number, lng: number): SolarTimes {
  const times = SunCalc.getTimes(date, lat, lng);
  return {
    sunrise: times.sunrise,
    sunset: times.sunset,
    goldenHour: times.goldenHour,
    goldenHourEnd: times.sunset, // SunCalc's sunset is basically end of golden hour
  };
}

export function getSunPosition(date: Date, lat: number, lng: number) {
  const pos = SunCalc.getPosition(date, lat, lng);
  return {
    azimuth: pos.azimuth * (180 / Math.PI),
    altitude: pos.altitude * (180 / Math.PI),
  };
}

/**
 * Calculates a "sunset quality score" (0-100) based on weather factors.
 * Ideal sunset: High clouds (scattered), middle clouds, low humidity, clear air.
 * Bad sunset: Dense low clouds (overcast), rain/fog.
 */
export function calculateQualityScore(cloudCover: number, humidity: number, visibility: number): number {
  // Simple heuristic
  // Cloud cover around 30-50% is often best for colors
  let score = 50;
  
  if (cloudCover > 20 && cloudCover < 60) {
    score += 30; // Scattered clouds are great
  } else if (cloudCover >= 60 && cloudCover < 90) {
    score += 10; // More clouds but still some light
  } else if (cloudCover >= 90) {
    score -= 40; // Overcast is bad
  } else {
    score -= 20; // Completely clear sky can be boring (no clouds to catch light)
  }

  // High visibility is better
  score += (visibility / 10000) * 10;
  
  // Humidity: lower humidity often means clearer colors
  score -= (humidity / 100) * 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}
