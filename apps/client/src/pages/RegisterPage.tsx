import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './RegisterPage.css'; 

interface RegisterPageProps {
    onRegisterSuccess: () => void;
}

function RegisterPage({ onRegisterSuccess }: RegisterPageProps) {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (nickname.trim().length < 3) {
      setError('Никнейм должен содержать минимум 3 символа');
      return false;
    }
    if (nickname.trim().length > 20) {
      setError('Никнейм не должен превышать 20 символов');
      return false;
    }
    if (!emailRegex.test(email)) {
      setError('Пожалуйста, введите корректный email');
      return false;
    }
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const registrationData = {
      nickname: nickname.trim(),
      email: email.trim(),
      password: password,
    };
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
    const REGISTER_API_URL = `${API_BASE_URL}/register/`;


    try {
      const response = await fetch(REGISTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log('Регистрация успешна на сервере:', responseData);
        onRegisterSuccess();
      } else {
        let errorMessage = `Ошибка регистрации (${response.status})`;
        if (responseData) {
           const fieldErrors = Object.entries(responseData)
             .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
             .join('; ');
           if (fieldErrors) {
               errorMessage = fieldErrors;
           } else if (responseData.detail) {
               errorMessage = responseData.detail;
           }
        }
        setError(errorMessage);
        console.error('Ошибка регистрации от сервера:', responseData);
      }
    } catch (err) {
      console.error('Сетевая ошибка или проблема с запросом:', err);
      setError('Не удалось подключиться к серверу. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page-container"> 
      <div className="register-form-card">
        <h1>Регистрация в StoryForge</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Никнейм (3-20 символов)"
            aria-label="Никнейм"
            maxLength={20}
            required
          />
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
            placeholder="Пароль (мин. 6 символов)"
            aria-label="Пароль"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Подтвердите пароль"
            aria-label="Подтверждение пароля"
            required
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={isLoading}>Зарегистрироваться</button>
        </form>
        
        <p className="switch-form-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
