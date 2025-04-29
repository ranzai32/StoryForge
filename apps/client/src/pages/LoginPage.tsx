import React, { useState } from 'react';
import { Link } from 'react-router-dom'; 
import './LoginPage.css'; 
const LOGIN_API_URL = 'http://127.0.0.1:8000/api/token/';
const ACCESS_TOKEN_KEY = 'storyforge_access_token';
const REFRESH_TOKEN_KEY = 'storyforge_refresh_token';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const loginData = { email: email.trim(), password: password };

    try {
      const response = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const responseData = await response.json();

      if (response.ok) { 
        console.log('Вход успешен:', responseData);
        localStorage.setItem(ACCESS_TOKEN_KEY, responseData.access);
        localStorage.setItem(REFRESH_TOKEN_KEY, responseData.refresh);

        onLoginSuccess();

      } else {
        let errorMessage = `Ошибка входа (${response.status})`;
        if (responseData && responseData.detail) {
           errorMessage = responseData.detail;
        } else {
            const fieldErrors = Object.entries(responseData || {})
                .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
                .join('; ');
             if (fieldErrors) errorMessage = fieldErrors;
        }
        setError(errorMessage);
        console.error('Ошибка входа:', responseData);
      }
    } catch (err) {
      console.error('Сетевая ошибка или проблема с запросом:', err);
      setError('Не удалось подключиться к серверу. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container"> 
      <div className="login-form-card">
        <h1>Вход в StoryForge</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            aria-label="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            aria-label="Пароль"
            required
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className="switch-form-link">
          Еще нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;