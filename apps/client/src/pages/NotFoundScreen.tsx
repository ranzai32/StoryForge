import { Link } from 'react-router-dom';

function NotFoundScreen() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Ошибка 404</h2>
      <p>Извините, страница, которую вы ищете, не найдена.</p>
      <Link to="/">Вернуться на главную</Link>
    </div>
  );
}

export default NotFoundScreen;