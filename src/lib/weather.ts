const API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;

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

export async function getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
  const mockData: WeatherData = {
    temp: 24,
    feels_like: 26,
    humidity: 45,
    clouds: 20,
    visibility: 10000,
    description: 'clear sky (simulated)',
    icon: '01d',
    isSimulated: true,
  };

  if (!API_KEY || API_KEY === "" || API_KEY.startsWith("YOUR_")) {
    return mockData;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) {
      return mockData;
    }
    const data = await response.json();
    return {
      temp: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      clouds: data.clouds.all,
      visibility: data.visibility,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      isSimulated: false,
    };
  } catch (error) {
    return mockData;
  }
}

export async function getForecast(lat: number, lng: number): Promise<ForecastData[]> {
  const generateMockForecast = () => {
    const now = Math.floor(Date.now() / 1000);
    return Array.from({ length: 40 }).map((_, i) => ({
      dt: now + i * 3 * 3600,
      temp: 20 + Math.random() * 5,
      clouds: Math.floor(Math.random() * 100),
      humidity: 40 + Math.random() * 20,
      visibility: 10000,
      pop: Math.random(),
      isSimulated: true,
    }));
  };

  if (!API_KEY || API_KEY === "" || API_KEY.startsWith("YOUR_")) {
    return generateMockForecast();
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) {
      return generateMockForecast();
    }
    const data = await response.json();
    
    return data.list.map((item: any) => ({
      dt: item.dt,
      temp: item.main.temp,
      clouds: item.clouds.all,
      humidity: item.main.humidity,
      visibility: item.visibility,
      pop: item.pop,
      isSimulated: false,
    }));
  } catch (error) {
    return generateMockForecast();
  }
}
