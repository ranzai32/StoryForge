import  { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './StoryBrowseScreen.css';

interface StoryBrowseSummary {
  id: number;
  title: string;
  description: string;
  genre: string;
  author_nickname: string;
  updated_at: string;
}

const BROWSE_API_URL = 'http://127.0.0.1:8000/api/browse-stories/';

function StoryBrowseScreen() {
  const [searchParams] = useSearchParams();
  const genreFilter = searchParams.get('genre');
  const searchFilter = searchParams.get('search');

  const [stories, setStories] = useState<StoryBrowseSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrowseStories = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (genreFilter) {
          params.append('genre', genreFilter);
      }
      if (searchFilter) {
          params.append('search', searchFilter);
      }
      const queryString = params.toString();
      const apiUrl = queryString ? `${BROWSE_API_URL}?${queryString}` : BROWSE_API_URL;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Ошибка загрузки историй: ${response.status} ${errorData?.detail || ''}`);
        }
        const data: StoryBrowseSummary[] = await response.json();
        setStories(data);
      } catch (err: unknown) {
         if (err instanceof Error) { setError(err.message); }
         else { setError("Не удалось загрузить список историй."); }
        console.error("Ошибка fetch в StoryBrowseScreen:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrowseStories();
  }, [genreFilter, searchFilter]);

  const getPageTitle = () => {
      if (searchFilter) return `Результаты поиска: "${searchFilter}"`;
      if (genreFilter) return `Обзор Историй: ${genreFilter}`;
      return 'Обзор Историй';
  }

  const getEmptyMessage = () => {
       if (searchFilter) return 'По вашему запросу ничего не найдено.';
       if (genreFilter) return `Историй в жанре "${genreFilter}" не найдено.`;
       return 'Пока нет ни одной истории для обзора.';
   }

  return (
    <div className="browse-stories-screen">
      <h1>{getPageTitle()}</h1>
      {(genreFilter || searchFilter) && <Link to="/browse" style={{marginBottom: '15px', display: 'inline-block'}}>Показать все истории</Link>}

      {isLoading && <p>Загрузка историй...</p>}
      {error && <p className="error-message" style={{color: '#ff8888'}}>{error}</p>}

      {!isLoading && !error && (
        <>
          {stories.length === 0 ? (
            <p>{getEmptyMessage()}</p>
          ) : (
            <ul className="stories-list">
              {stories.map(story => (
                <li key={story.id} className="story-item">
                  <div className="story-info">
                    <h3>{story.title || "(Без названия)"}</h3>
                    <p className="story-author">Автор: {story.author_nickname || "Аноним"}</p>
                    <p className="story-genre">Жанр: {story.genre || "Не указан"}</p>
                    <p className="story-description">{story.description || "Нет описания."}</p>
                    <p className="story-updated">Обновлено: {new Date(story.updated_at).toLocaleString()}</p>
                  </div>
                  <div className="story-actions">
                    <Link to={`/read/${story.id}`} className="read-link">Читать</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default StoryBrowseScreen;
