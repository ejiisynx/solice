import React, { useState, useEffect } from 'react';
import { AuthProvider } from './components/AuthContext';
import { Layout } from './components/Layout';
import { useGeolocation } from './hooks/useGeolocation';
import { getCurrentWeather, getForecast } from './lib/weather';
import { calculateQualityScore } from './lib/sun';
import { SunTracker } from './components/SunTracker';
import { ForecastStrip } from './components/ForecastStrip';
import { SpotMap } from './components/SpotMap';
import { CommunityFeed } from './components/CommunityFeed';
import { Journal } from './components/Journal';
import { Badges } from './components/Badges';
import { Alerts } from './components/Alerts';
import { Moderation } from './components/Moderation';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './components/AuthContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const { isAdmin } = useAuth();
  const { location, error: geoError, loading: geoLoading } = useGeolocation();
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location) {
      const fetchData = async () => {
        try {
          const [weatherData, forecastData] = await Promise.all([
            getCurrentWeather(location.latitude, location.longitude),
            getForecast(location.latitude, location.longitude)
          ]);
          setWeather(weatherData);
          setForecast(forecastData);
        } catch (error) {
          console.error("Error fetching weather:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else if (geoError) {
      // If geo fails, use a fallback (e.g. San Diego) for demo
      const fetchFallback = async () => {
        try {
          const lat = 32.7157;
          const lon = -117.1611;
          const [weatherData, forecastData] = await Promise.all([
            getCurrentWeather(lat, lon),
            getForecast(lat, lon)
          ]);
          setWeather(weatherData);
          setForecast(forecastData);
        } catch (error) {
           console.error("Fallback error:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchFallback();
    }
  }, [location, geoError]);

  const qualityScore = React.useMemo(() => {
    if (!weather) return 50;
    return calculateQualityScore(weather.clouds, weather.humidity, weather.visibility);
  }, [weather]);

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-12">
            <SunTracker 
              location={location || { latitude: 32.7157, longitude: -117.1611 }} 
              weather={weather} 
              qualityScore={qualityScore} 
            />
            <ForecastStrip 
              forecast={forecast} 
              location={location || { latitude: 32.7157, longitude: -117.1611 }} 
            />
          </div>
        );
      case 'map':
        return <SpotMap location={location} />;
      case 'feed':
        return <CommunityFeed />;
      case 'journal':
        return <Journal />;
      case 'moderation':
        return isAdmin ? <Moderation /> : null;
      case 'progress':
        return (
          <div className="space-y-12 pb-12">
            <Badges />
            <Alerts />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
