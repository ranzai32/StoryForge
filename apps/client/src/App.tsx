import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import StoryEditorScreen from './pages/StoryEditorScreen';
import NotFoundScreen from './pages/NotFoundScreen';
import MyStoriesScreen from './pages/MyStoriesScreen';
import StoryBrowseScreen from './pages/StoryBrowseScreen';
import StoryReaderScreen from './pages/StoryReaderScreen';
import PassageScreen from './pages/PassageScreen'; 
import HelpPage from './pages/HelpPage';
import './App.css';

const ACCESS_TOKEN_KEY = 'storyforge_access_token';
const REFRESH_TOKEN_KEY = 'storyforge_refresh_token';
const USER_API_URL = 'http://127.0.0.1:8000/api/users/me/';

interface UserData {
  id: number;
  email: string;
  nickname: string;
}

function ProtectedLayout({ isAuthenticated, onLogout, children }: { isAuthenticated: boolean, onLogout: () => void, children: React.ReactNode }) {
  const [currentUserForHeader, setCurrentUserForHeader] = useState<UserData | null>(null);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const REFRESH_API_URL = 'http://127.0.0.1:8000/api/token/refresh/';

  const fetchUserWithRefresh = useCallback(async (initialToken: string | null) => {
      const token = initialToken || localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
          onLogout();
          setIsUserDataLoading(false);
          return;
      }

      setIsUserDataLoading(true);

      try {
          const response = await fetch(USER_API_URL, {
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
              const data: UserData = await response.json();
              setCurrentUserForHeader(data);
              setIsUserDataLoading(false);
          } else if (response.status === 401) {
              const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
              if (!refreshToken) {
                  onLogout();
                  setIsUserDataLoading(false);
                  return;
              }

              try {
                  const refreshResponse = await fetch(REFRESH_API_URL, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ refresh: refreshToken })
                  });
                  const refreshData = await refreshResponse.json();

                  if (refreshResponse.ok) {
                      const newAccessToken = refreshData.access;
                      localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
                      fetchUserWithRefresh(newAccessToken);
                  } else {
                      onLogout();
                      setIsUserDataLoading(false);
                  }
              } catch (refreshError) {
                  console.error('Error refreshing token:', refreshError);
                  onLogout();
                  setIsUserDataLoading(false);
              }
          } else {
              onLogout();
              setIsUserDataLoading(false);
          }
      } catch (error) {
          console.error('Error fetching user data:', error);
          onLogout();
          setIsUserDataLoading(false);
      }
  }, [onLogout]);

  useEffect(() => {
      if (isAuthenticated) {
          fetchUserWithRefresh(null);
      } else {
          setCurrentUserForHeader(null);
          setIsUserDataLoading(false);
      }
  }, [isAuthenticated, fetchUserWithRefresh]);

  if (!isAuthenticated && !isUserDataLoading) {
      return <Navigate to="/login" replace />;
  }

  if (isUserDataLoading) {
       return <div>Загрузка пользователя...</div>;
  }

  return (
      <div className="app-container">
          <Header nickname={currentUserForHeader?.nickname || null} onLogout={onLogout} />
          <main className="page-content">
              {children}
          </main>
      </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      setIsAuthenticated(!!accessToken);
  }, []);

  const handleLogout = useCallback(() => {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setIsAuthenticated(false);
  }, []);

  const handleLoginSuccess = useCallback(() => {
      setIsAuthenticated(true);
  }, []);

  const handleRegisterSuccess = useCallback(() => {
      navigate('/login');
  }, [navigate]);

  return (
      <Routes>
          <Route
              path="/login"
              element={!isAuthenticated ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />}
          />
          <Route
              path="/register"
              element={!isAuthenticated ? <RegisterPage onRegisterSuccess={handleRegisterSuccess} /> : <Navigate to="/" replace />}

        
          />

          <Route
              path="/*"
              element={
                  <ProtectedLayout isAuthenticated={isAuthenticated} onLogout={handleLogout}>
                      <Routes>
                           
                           <Route path="/" element={<HomePage />} />
                           <Route path="/editor" element={<StoryEditorScreen />} />
                           <Route path="/read/:storyId" element={<StoryReaderScreen />} />
                           <Route path="/editor/:storyId" element={<StoryEditorScreen />} />
                           <Route path="/my-stories" element={<MyStoriesScreen />} />
                           <Route path="/browse" element={<StoryBrowseScreen />} />
                           <Route path="/help" element={<HelpPage />} />
                           <Route path="*" element={<NotFoundScreen />} />
                           <Route path="/passage/:passageId" element={<PassageScreen />} />
                           
                      </Routes>
                  </ProtectedLayout>
              }
          />
      </Routes>
  );
}

export default App;
