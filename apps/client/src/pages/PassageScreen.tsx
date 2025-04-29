import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './PassageScreen.css';

interface PassageData {
    id: number;
    story: number;
    story_title: string;
    user_nickname: string;
    path: Array<{ chapterId: string | number, actionId: string | number | null }>;
    created_at: string;
}

interface ChapterData {
    id: number | string;
    title: string;
    content: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const PASSAGES_API_URL = `${API_BASE_URL}/passages/`;
const CHAPTERS_API_URL = `${API_BASE_URL}/chapters/`;

function PassageScreen() {
    const { passageId } = useParams<{ passageId: string }>();
    const [passageData, setPassageData] = useState<PassageData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [finalChapterData, setFinalChapterData] = useState<ChapterData | null>(null);
    const [, setIsLoadingChapter] = useState<boolean>(false);

    useEffect(() => {
        const fetchPassage = async () => {
            if (!passageId) {
                setError("ID прохождения не найден в URL.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            setFinalChapterData(null);
            setPassageData(null);
            setIsLoadingChapter(false);

            try {
                const response = await fetch(`${PASSAGES_API_URL}${passageId}/`);
                if (response.ok) {
                    const data: PassageData = await response.json();
                    setPassageData(data);

                    if (data.path && data.path.length > 0) {
                        const lastStep = data.path[data.path.length - 1];
                        const lastChapterId = lastStep.chapterId;
                        fetchFinalChapter(lastChapterId);
                    } else {
                        setIsLoading(false);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Ошибка загрузки прохождения (${response.status}): ${errorData?.detail || response.statusText}`);
                }
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message || "Не удалось загрузить данные прохождения.");
                } else {
                    setError("Не удалось загрузить данные прохождения.");
                }
                setIsLoading(false);
            }
        };

        fetchPassage();
    }, [passageId]);

    const fetchFinalChapter = async (chapterId: string | number) => {
        if (!chapterId) {
            setIsLoading(false);
            return;
        }
        setIsLoadingChapter(true);
        try {
            const response = await fetch(`${CHAPTERS_API_URL}${chapterId}/`);
            if (response.ok) {
                const data: ChapterData = await response.json();
                setFinalChapterData(data);
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(prev => prev ? `${prev}; ${err.message}` : err.message);
            } else {
                setError(prev => prev ? `${prev}; Неизвестная ошибка` : "Неизвестная ошибка");
            }
            setFinalChapterData(null);
        } finally {
            setIsLoadingChapter(false);
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="passage-loading">Загрузка прохождения...</div>;
    }

    if (error) {
        return <div className="passage-error">Ошибка: {error} <Link to="/">На главную</Link></div>;
    }

    if (!passageData) {
        return <div className="passage-error">Прохождение не найдено. <Link to="/">На главную</Link></div>;
    }

    return (
        <div className="passage-screen">
            <h1>Результат прохождения истории</h1>
            <div className="passage-details">
                <p>
                    Пользователь <strong>{passageData.user_nickname || "Аноним"}</strong>
                    прошел(ла) историю "{passageData.story_title || "(Без названия)"}"
                </p>
                {finalChapterData ? (
                    <div className="final-chapter">
                        <h3>Исход: {finalChapterData.title}</h3>
                        <div className="final-chapter-content">
                            {finalChapterData.content.split('\n').map((paragraph, index) => (
                                <p key={index}>{paragraph || <>&nbsp;</>}</p>
                            ))}
                        </div>
                    </div>
                ) : (
                    passageData.path && passageData.path.length > 0 &&
                    <p style={{ fontStyle: 'italic', color: '#aaa', marginTop: '20px' }}>
                        (Не удалось загрузить детали концовки)
                    </p>
                )}
                <p style={{marginTop: '15px', fontSize: '0.9em', color: '#aaa'}}>
                    Дата: {new Date(passageData.created_at).toLocaleString()}
                </p>
            </div>
            <div className="passage-actions">
                <Link to={`/read/${passageData.story}`}>Пройти эту историю</Link>
                <span style={{margin: '0 10px'}}>|</span>
                <Link to="/browse">К обзору историй</Link>
            </div>
        </div>
    );
}

export default PassageScreen;
