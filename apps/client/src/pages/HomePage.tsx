import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Slider from "react-slick";
import './HomePage.css';

interface StoryBrowseSummary {
  id: number;
  title: string;
  description: string;
  genre: string;
  author_nickname: string;
  updated_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const BROWSE_API_URL = `${API_BASE_URL}/browse-stories/`;

const genres = [
  "Фэнтези",
  "Научная фантастика",
  "Драма",
  "Приключения",
  "Ужасы",
  "Детектив",
  "Романтика",
  "Другое"
];

function StoryCard({ story }: { story: StoryBrowseSummary }) {
    return (
        <div className="story-card">
            <h3>{story.title || "(Без названия)"}</h3>
            <p className="story-card-author">Автор: {story.author_nickname || "Аноним"}</p>
            <p className="story-card-genre">Жанр: {story.genre || "Не указан"}</p>
            <p className="story-card-desc">{story.description?.substring(0, 100) || "Нет описания."}{story.description && story.description.length > 100 ? '...' : ''}</p>
            <Link to={`/read/${story.id}`} className="read-link-card">Читать</Link>
        </div>
    );
}

function HomePage() {
    const [recommendedStories, setRecommendedStories] = useState<StoryBrowseSummary[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecommendedStories = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(BROWSE_API_URL);
                if (!response.ok) throw new Error(`Ошибка загрузки историй: ${response.status}`);
                const data: StoryBrowseSummary[] = await response.json();
                setRecommendedStories(data.slice(0, 10));
            } catch (err: unknown) {
                 if (err instanceof Error) { setError(err.message); }
                 else { setError("Не удалось загрузить рекомендуемые истории."); }
                console.error("Ошибка fetch в HomePage:", err);
            } finally { setIsLoading(false); }
        };
        fetchRecommendedStories();
    }, []);

    const sliderSettings = {
        dots: true,
        infinite: recommendedStories.length > 3,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        pauseOnHover: true,
        responsive: [
            { breakpoint: 1024, settings: { slidesToShow: 2, infinite: recommendedStories.length > 2 } },
            { breakpoint: 600, settings: { slidesToShow: 1, infinite: recommendedStories.length > 1 } }
        ]
    };

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/browse?search=${encodeURIComponent(searchTerm.trim())}`);
        } else {
             navigate('/browse');
        }
    };

    return (
        <div className="home-page">
            <main className="home-content">
                <section className="recommendations">
                    <h2>Рекомендуемые истории</h2>
                    {isLoading && <p>Загрузка...</p>}
                    {error && <p className="error-message" style={{color: '#ff8888'}}>{error}</p>}
                    {!isLoading && !error && recommendedStories.length > 0 && (
                        <div className="slider-container">
                             <Slider {...sliderSettings}>
                                {recommendedStories.map(story => (
                                    <div key={story.id} className="slide-wrapper">
                                        <StoryCard story={story} />
                                    </div>
                                ))}
                            </Slider>
                        </div>
                    )}
                     {!isLoading && !error && recommendedStories.length === 0 && ( <p>Пока нет историй для рекомендации.</p> )}
                </section>

                <section className="search-section">
                    <form onSubmit={handleSearchSubmit}>
                        <input
                            type="search"
                            placeholder="Поиск историй по названию, автору, жанру..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit">Найти</button>
                    </form>
                </section>

                <section className="collections">
                    <h2>Тематические подборки</h2>
                    <div className="collections-grid">
                        {genres.map((genre) => (
                            <Link
                                key={genre}
                                to={`/browse?genre=${encodeURIComponent(genre)}`}
                                className="collection-item"
                            >
                                {genre}
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="create-action">
                    <Link to="/editor">
                        <button className="create-story-button">Создать свою историю</button>
                    </Link>
                </section>

                <section className="testimonials">
                    <h2>Отзывы пользователей</h2>
                    <div className="testimonial-item">
                        <img src="https://i.pinimg.com/736x/07/66/d1/0766d183119ff92920403eb7ae566a85.jpg" alt="Фото пользователя" className="testimonial-avatar"/>
                        <div className="testimonial-content">
                            <p>"Это лучшая платформа для воплощения моих идей! Редактор очень удобный."</p>
                            <span className="testimonial-author">- Довольный Автор</span>
                        </div>
                    </div>
                     <div className="testimonial-item">
                        <img src="https://i.pinimg.com/736x/07/66/d1/0766d183119ff92920403eb7ae566a85.jpg" alt="Фото пользователя" className="testimonial-avatar"/>
                        <div className="testimonial-content">
                            <p>"Наконец-то я могу легко создавать интерактивные истории и делиться ими!"</p>
                            <span className="testimonial-author">- Энтузиаст Читатель</span>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default HomePage;
