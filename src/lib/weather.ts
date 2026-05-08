export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  clouds: number;
  visibility: number;
  description: string;
  icon: string;
  isSimulated?: boolean;
}

export interface ForecastData {
  dt: number;
  temp: number;
  clouds: number;
  humidity: number;
  visibility: number;
  pop: number; // Probability of precipitation
  isSimulated?: boolean;
}

// Function to map WMO Weather Codes to descriptions and OpenWeather-style icons
function getWeatherInfo(code: number) {
  const mapping: Record<number, { description: string; icon: string }> = {
    0: { description: 'Clear sky', icon: '01d' },
    1: { description: 'Mainly clear', icon: '02d' },
    2: { description: 'Partly cloudy', icon: '03d' },
    3: { description: 'Overcast', icon: '04d' },
    45: { description: 'Fog', icon: '50d' },
    48: { description: 'Depositing rime fog', icon: '50d' },
    51: { description: 'Light drizzle', icon: '09d' },
    53: { description: 'Moderate drizzle', icon: '09d' },
    55: { description: 'Dense drizzle', icon: '09d' },
    61: { description: 'Slight rain', icon: '10d' },
    63: { description: 'Moderate rain', icon: '10d' },
    65: { description: 'Heavy rain', icon: '10d' },
    71: { description: 'Slight snow fall', icon: '13d' },
    73: { description: 'Moderate snow fall', icon: '13d' },
    75: { description: 'Heavy snow fall', icon: '13d' },
    80: { description: 'Slight rain showers', icon: '09d' },
    81: { description: 'Moderate rain showers', icon: '09d' },
    82: { description: 'Violent rain showers', icon: '09d' },
    95: { description: 'Thunderstorm', icon: '11d' },
  };
  return mapping[code] || { description: 'Unknown', icon: '03d' };
}

export async function getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
  const mockData: WeatherData = {
    temp: 24,
    feels_like: 26,
    humidity: 45,
    clouds: 20,
    visibility: 10000,
    description: 'Clear sky (simulated)',
    icon: '01d',
    isSimulated: true,
  };

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,cloud_cover,visibility,weather_code&wind_speed_unit=ms&timeformat=unixtime`;
    const response = await fetch(url);
    if (!response.ok) return mockData;

    const data = await response.json();
    const current = data.current;
    const weatherInfo = getWeatherInfo(current.weather_code);

    return {
      temp: current.temperature_2m,
      feels_like: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      clouds: current.cloud_cover,
      visibility: current.visibility,
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      isSimulated: false,
    };
  } catch (error) {
    console.error('Weather Fetch Error:', error);
    return mockData;
  }
}

export async function getForecast(lat: number, lng: number): Promise<ForecastData[]> {
  const generateMockForecast = () => {
    const now = Math.floor(Date.now() / 1000);
    return Array.from({ length: 24 }).map((_, i) => ({
      dt: now + i * 3600,
      temp: 20 + Math.random() * 5,
      clouds: Math.floor(Math.random() * 100),
      humidity: 40 + Math.random() * 20,
      visibility: 10000,
      pop: Math.random(),
      isSimulated: true,
    }));
  };

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,cloud_cover,visibility,precipitation_probability&timeformat=unixtime&forecast_days=2`;
    const response = await fetch(url);
    if (!response.ok) return generateMockForecast();

    const data = await response.json();
    const hourly = data.hourly;
    
    return hourly.time.map((time: number, index: number) => ({
      dt: time,
      temp: hourly.temperature_2m[index],
      clouds: hourly.cloud_cover[index],
      humidity: hourly.relative_humidity_2m[index],
      visibility: hourly.visibility[index],
      pop: hourly.precipitation_probability[index] / 100,
      isSimulated: false,
    }));
  } catch (error) {
    console.error('Forecast Fetch Error:', error);
    return generateMockForecast();
  }
}
