import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './StoryReaderScreen.css';

interface StoryAction {
  id: string | number;
  text: string;
  nextChapterId: string | number | null;
  target_chapter?: number | null;
  source_chapter?: number;
}

interface StoryChapter {
  id: string | number;
  title: string;
  content: string;
  actions?: StoryAction[];
  story?: number;
}

interface StoryData {
    id: number;
    title: string;
    description?: string;
    genre?: string;
    author_nickname?: string;
}

interface PassageStep {
    chapterId: string | number;
    actionId: string | number | null;
}

const NICKNAME_STORAGE_KEY = 'storyforge_nickname';
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const STORY_DETAIL_API_URL_BASE = `${API_BASE_URL}/browse-stories/`;
const CHAPTERS_API_URL = `${API_BASE_URL}/chapters/`;
const ACTIONS_API_URL = `${API_BASE_URL}/actions/`;
const PASSAGES_API_URL = `${API_BASE_URL}/passages/`;
const ACCESS_TOKEN_KEY = 'storyforge_access_token';

function StoryReaderScreen() {
    const { storyId } = useParams<{ storyId: string }>();

    const [storyData, setStoryData] = useState<StoryData | null>(null);
    const [allChapters, setAllChapters] = useState<StoryChapter[]>([]);
    const [currentChapter, setCurrentChapter] = useState<StoryChapter | null>(null);
    const [currentActions, setCurrentActions] = useState<StoryAction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isEnd, setIsEnd] = useState<boolean>(false);
    const [passagePath, setPassagePath] = useState<PassageStep[]>([]);
    const [isSavingPassage, setIsSavingPassage] = useState(false);
    const [savePassageError, setSavePassageError] = useState<string | null>(null);
    const [savedPassageId, setSavedPassageId] = useState<number | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!storyId) { setError("ID истории не найден."); setIsLoading(false); return; }
            setIsLoading(true); setError(null); setIsEnd(false); setPassagePath([]); setSavedPassageId(null);
            setCurrentChapter(null); setCurrentActions([]); setAllChapters([]); setStoryData(null);

            try {
                const storyUrl = `${STORY_DETAIL_API_URL_BASE}${storyId}/`;
                const chaptersUrl = `${CHAPTERS_API_URL}?story_id=${storyId}`;

                const [storyRes, chaptersRes] = await Promise.all([
                    fetch(storyUrl),
                    fetch(chaptersUrl)
                ]);

                if (!storyRes.ok) throw new Error(`Ошибка загрузки истории: ${storyRes.status}`);
                const fetchedStoryData: StoryData = await storyRes.json();
                setStoryData(fetchedStoryData);

                if (!chaptersRes.ok) throw new Error(`Ошибка загрузки глав: ${chaptersRes.status}`);
                const fetchedChapters: StoryChapter[] = await chaptersRes.json();
                setAllChapters(fetchedChapters);

                if (fetchedChapters.length > 0) {
                    const firstChapter = fetchedChapters[0];
                    setCurrentChapter(firstChapter);
                    setPassagePath([{ chapterId: firstChapter.id, actionId: null }]);
                } else {
                    setError("В этой истории нет глав.");
                    setIsLoading(false);
                }

            } catch (err: unknown) {
                if (err instanceof Error) {
                    console.error("Ошибка загрузки данных для читалки:", err);
                    setError(err.message || "Не удалось загрузить историю.");
                } else {
                    console.error("Неизвестная ошибка:", err);
                    setError("Неизвестная ошибка при загрузке данных.");
                }
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [storyId]);

    useEffect(() => {
        const loadActions = async () => {
            const chapterId = currentChapter?.id;
            if (typeof chapterId !== 'number') {
                setCurrentActions([]);
                setIsLoading(false);
                return;
            };
  
            console.log(`Загрузка действий для главы ID: ${chapterId}`);
            setIsLoading(true);
            setError(null);
             
  
             try {
 
                  const response = await fetch(`${ACTIONS_API_URL}?source_chapter_id=${chapterId}`);
                  if (!response.ok) throw new Error(`Ошибка загрузки действий: ${response.status}`);
                  const actionsData: StoryAction[] = await response.json();
                  const formattedActions = actionsData.map(action => ({
                      ...action,
                      nextChapterId: action.target_chapter !== null && action.target_chapter !== undefined
                                       ? String(action.target_chapter) : null }));
                  setCurrentActions(formattedActions);
              } catch (err: unknown) {
                   if (err instanceof Error) {
                       console.error("Ошибка загрузки действий:", err);
                       setError(err.message || "Не удалось загрузить действия для главы.");
                   } else {
                       console.error("Неизвестная ошибка:", err);
                       setError("Неизвестная ошибка при загрузке действий.");
                   }
                   setCurrentActions([]);
              } finally {
                   setIsLoading(false);
              }
        };
  
        if (currentChapter) {
           loadActions();
        } else if (!isLoading && !error && !allChapters.length) {  
            setIsLoading(false);
        }
  
    }, [currentChapter?.id]);

    const handleActionClick = (action: StoryAction) => {
        setError(null); setIsEnd(false);
        const nextId = action.nextChapterId;

        if (currentChapter) {
            const actionIdToSave = typeof action.id === 'number' ? action.id : null;
            setPassagePath(prev => [...prev, { chapterId: currentChapter.id, actionId: actionIdToSave }]);
        }

        if (nextId === null || nextId === '') {
            setIsEnd(true);
            setCurrentChapter(null);
            setCurrentActions([]);
        } else {
            const nextChapter = allChapters.find(chap => String(chap.id) === String(nextId));
            if (nextChapter) {
                setCurrentChapter(nextChapter);
            } else {
                console.error(`Глава с ID ${nextId} не найдена в загруженном списке!`);
                setError(`Ошибка: Не удалось найти следующую главу (ID: ${nextId}).`);
            }
        }
    };

    const handleSavePassage = async () => {
        const storyIdNum = storyId ? parseInt(storyId, 10) : null;
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY); 
  
 
        if (!accessToken) {
 
            alert("Необходимо войти в систему, чтобы сохранить результат.");
            setError("Необходимо войти в систему, чтобы сохранить результат.");  
 
            return;
        }
        if (!storyIdNum) {
            alert("Ошибка: Не найден ID истории.");  
            setError("Ошибка: Не найден ID истории.");
            return;
        }
  
        setIsSavingPassage(true);
        setSavePassageError(null);
  
        const passageData = {
            story: storyIdNum,
            path: passagePath  
        };
        console.log("Отправка данных прохождения (с токеном):", passageData);
  
        try {
 
            const response = await fetch(PASSAGES_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
 
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(passageData)
            });
            const responseData = await response.json();
  
            if (response.ok || response.status === 201) {
                console.log("Прохождение успешно сохранено:", responseData);
                setSavedPassageId(responseData.id);  
                setSavePassageError(null);
            } else {
 
                 let errorMsg = `Ошибка сохранения (${response.status})`;
                 if (responseData?.detail) {
                     errorMsg = responseData.detail;
                 } else if (typeof responseData === 'object' && responseData !== null) {
                     const fieldErrors = Object.entries(responseData)
                         .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
                         .join('; ');
                      if (fieldErrors) errorMsg = fieldErrors;
                 }
 
                 setSavePassageError(errorMsg);
                 console.error('Ошибка сохранения прохождения:', responseData);
            }
        } catch (err: unknown) {  
            console.error("Сетевая ошибка при сохранении прохождения:", err);
            if (err instanceof Error) {
                setSavePassageError(err.message || "Не удалось сохранить прохождение (сетевая ошибка).");
            } else {
                setSavePassageError("Неизвестная ошибка при сохранении прохождения.");
            }
        } finally {
            setIsSavingPassage(false);
        }
    };

    if (isLoading) { return <div className="story-reader-loading">Загрузка истории...</div>; }
    if (error && !currentChapter && !isEnd) {
        return <div className="story-reader-error">Ошибка: {error} <Link to="/">На главную</Link></div>;
    }
    if (!currentChapter && !isEnd) {
         return <div className="story-reader-error">Ошибка: Не удалось загрузить начальную главу. <Link to="/">На главную</Link></div>;
    }

    return (
        <div className="story-reader-screen">
            <h1 className="story-title">{storyData?.title || 'История без названия'}</h1>
            <hr />

            {isEnd ? (
                <div className="story-end">
                    <h2>Конец истории.</h2>
                    <div className="passage-summary">
                         Поздравляем, {localStorage.getItem(NICKNAME_STORAGE_KEY) || 'Игрок'}!
                         Вы завершили историю "{storyData?.title || ''}".
                    </div>
                    <div className="passage-share">
                        {!savedPassageId && !savePassageError && (
                            <button onClick={handleSavePassage} disabled={isSavingPassage}>
                                {isSavingPassage ? 'Сохранение...' : 'Сохранить и Поделиться результатом'}
                            </button>
                        )}
                        {savePassageError && (
                            <p className="error-message" style={{color: 'red'}}>Ошибка сохранения: {savePassageError}</p>
                        )}
                        {savedPassageId && (
                            <div>
                                <p>Ваше прохождение сохранено! Поделитесь ссылкой:</p>
                                <input
                                    type="text" readOnly
                                    value={`${window.location.origin}/passage/${savedPassageId}`}
                                    className="share-link-input"
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                        )}
                    </div>
                    <Link to="/browse" style={{marginTop: '20px', display: 'inline-block'}}>К обзору историй</Link>
                </div>
            ) : currentChapter ? (
                <div className="chapter-display">
                    <h2 className="chapter-title">{currentChapter.title}</h2>
                    <div className="chapter-content">
                        {currentChapter.content.split('\n').map((paragraph, index) => (
                            <p key={index}>{paragraph || <>&nbsp;</>}</p>
                        ))}
                    </div>
                    <div className="chapter-actions">
                        <h3>Ваши действия:</h3>
                        {currentActions.length > 0 ? (
                            currentActions.map(action => (
                                <button key={action.id} onClick={() => handleActionClick(action)} className="action-button">
                                {action.text}
                                </button>
                            ))
                        ) : ( <p><i>(Нет доступных действий. Возможно, это конец ветки?)</i></p> )}
                    </div>
                </div>
            ) : (
                 <p>Загрузка главы...</p>
            )}
        </div>
    );
}

export default StoryReaderScreen;
