
import { Link } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  nickname: string | null; 
  onLogout: () => void;   
}
function Header({ nickname, onLogout }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="logo">
        <Link to="/">StoryForge</Link>
      </div>
      <nav className="main-nav">
        <ul>
          <li><Link to="/editor">Создать историю</Link></li>
          <li><Link to="/my-stories">Мои истории</Link></li>
          <li><Link to="/browse">Обзор историй</Link></li>
          <li><Link to="/help">Помощь</Link></li>
        </ul>
      </nav>
      <div className="user-info">
        {nickname ? (
          <>
            <span className="user-nickname">Привет, {nickname}!</span>
            <button onClick={onLogout} className="logout-button">Выйти</button>
          </>
        ) : (
          <Link to="/login">Войти</Link>
        )}
      </div>
    </header>
  );
}

export default Header;