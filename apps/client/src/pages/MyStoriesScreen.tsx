import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MyStoriesScreen.css';

interface StorySummary {
  id: number;
  title: string;
  description: string;
  genre: string;
  updated_at: string;
  author_nickname?: string;
}

const ACCESS_TOKEN_KEY = 'storyforge_access_token';
const MY_STORIES_API_URL = 'http://127.0.0.1:8000/api/stories/';
const STORIES_API_URL_BASE = 'http://127.0.0.1:8000/api/stories/';

function MyStoriesScreen() {
  const [stories, setStories] = useState<StorySummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (!token) {
            setError("Вы не авторизованы.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(MY_STORIES_API_URL, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data: StorySummary[] = await response.json();
                setStories(data);
            } else if (response.status === 401) {
                 setError("Сессия истекла или недействительна. Пожалуйста, войдите снова.");
            } else {
                throw new Error(`Ошибка загрузки историй: ${response.status}`);
            }
        } catch (err: unknown) {
            console.error("Ошибка fetch в MyStoriesScreen:", err);
            if (err instanceof Error) {
                setError(err.message || "Не удалось загрузить истории.");
            } else {
                setError("Неизвестная ошибка.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    fetchStories();
  }, []);

  const handleDeleteStory = async (storyIdToDelete: number) => {
      if (!window.confirm(`Вы уверены, что хотите удалить историю ID ${storyIdToDelete}? Это действие необратимо, все главы и персонажи также будут удалены!`)) {
          return;
      }
      setDeletingId(storyIdToDelete);
      setError(null);
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) { alert("Ошибка: Вы не авторизованы."); setDeletingId(null); return; }

      try {
          const response = await fetch(`${STORIES_API_URL_BASE}${storyIdToDelete}/`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok || response.status === 204) {
              console.log(`История ${storyIdToDelete} успешно удалена с сервера.`);
              setStories(prevStories => prevStories.filter(story => story.id !== storyIdToDelete));
          } else {
              const errorData = await response.json().catch(() => ({}));
              console.error(`Ошибка удаления истории ${storyIdToDelete} (${response.status}):`, errorData);
              setError(`Не удалось удалить историю: ${errorData?.detail || response.statusText}`);
          }
      } catch (err: unknown) {
          if (err instanceof Error) {
              console.error("Сетевая ошибка при удалении истории:", err.message);
              setError("Произошла сетевая ошибка при удалении истории.");
          } else {
              console.error("Неизвестная ошибка при удалении истории:", err);
              setError("Произошла неизвестная ошибка при удалении истории.");
          }
      } finally {
          setDeletingId(null);
      }
  };

  return (
    <div className="my-stories-screen">
      <h1>Мои Истории</h1>

      {isLoading && <p>Загрузка историй...</p>}
      {error && !isLoading && <p className="error-message" style={{color: 'red'}}>{error}</p>}

      {!isLoading && !error && (
        <>
          {stories.length === 0 ? (
            <p>У вас пока нет созданных историй.</p>
          ) : (
            <ul className="stories-list">
              {stories.map(story => (
                <li key={story.id} className="story-item">
                  <div className="story-info">
                    <h3>{story.title || "(Без названия)"}</h3>
                    <p className="story-genre">Жанр: {story.genre || "Не указан"}</p>
                    <p className="story-description">{story.description || "Нет описания."}</p>
                    <p className="story-updated">Обновлено: {new Date(story.updated_at).toLocaleString()}</p>
                  </div>
                  <div className="story-actions">
                    <Link to={`/read/${story.id}`} className="read-link">
                        Читать
                    </Link>
                    <Link to={`/editor/${story.id}`} className="edit-link">
                      Редактировать
                    </Link>
                    <button
                      onClick={() => handleDeleteStory(story.id)}
                      className="delete-button"
                      disabled={deletingId === story.id}
                      title="Удалить историю"
                    >
                      {deletingId === story.id ? 'Удаление...' : 'Удалить'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="add-new-story-link">
            <Link to="/editor">Создать новую историю</Link>
          </div>
        </>
      )}
    </div>
  );
}

export default MyStoriesScreen;
