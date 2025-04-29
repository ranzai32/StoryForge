import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './StoryEditorScreen.css';

interface StoryAction {
  id: string;
  text: string;
  nextChapterId: string | null;
}

interface StoryChapter {
  id: string;
  title: string;
  content: string;
  actions: StoryAction[];
}

interface StoryCharacter {
  id: string;
  name: string;
  description?: string;
}

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

const ACCESS_TOKEN_KEY = 'storyforge_access_token';
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const STORIES_API_URL = `${API_BASE_URL}/stories/`;
const CHAPTERS_API_URL = `${API_BASE_URL}/chapters/`;
const CHARACTERS_API_URL = `${API_BASE_URL}/characters/`;
const ACTIONS_API_URL = `${API_BASE_URL}/actions/`;

function StoryEditorScreen() {
  const { storyId } = useParams<{ storyId?: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState<string>(genres[0]);
  const [characters, setCharacters] = useState<StoryCharacter[]>([]);
  const [chapters, setChapters] = useState<StoryChapter[]>([]);

  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [currentChapterTitle, setCurrentChapterTitle] = useState('');
  const [currentChapterContent, setCurrentChapterContent] = useState('');
  const [currentChapterActions, setCurrentChapterActions] = useState<StoryAction[]>([]);

  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [currentCharacterName, setCurrentCharacterName] = useState('');
  const [currentCharacterDescription, setCurrentCharacterDescription] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentStoryId, setCurrentStoryId] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const storyIdNum = storyId ? parseInt(storyId, 10) : null;
    setCurrentStoryId(storyIdNum);

    const loadStoryData = async (id: number) => {
      setIsLoadingData(true);
      setLoadError(null);
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) { /* ... обработка ошибки ... */ return; }
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        
        const [storyRes, chaptersRes, charactersRes] = await Promise.all([
          fetch(`${STORIES_API_URL}${id}/`, { headers }),
          fetch(`${CHAPTERS_API_URL}?story_id=${id}`, { headers }),
          fetch(`${CHARACTERS_API_URL}?story_id=${id}`, { headers })
        ]);

         
        if (!storyRes.ok) throw new Error(/*...*/);
        const storyData = await storyRes.json();
        setTitle(storyData.title || '');
        setDescription(storyData.description || '');
        setGenre(storyData.genre || genres[0]);
        

         
        if (!charactersRes.ok) throw new Error(/*...*/);
        const charactersData = await charactersRes.json();
        setCharacters(charactersData || []); 
        

     
        if (!chaptersRes.ok) throw new Error(/*...*/);
        let chaptersData: StoryChapter[] = await chaptersRes.json();  
        
        
        if (chaptersData && chaptersData.length > 0) {
          
          const actionPromises = chaptersData.map(chapter =>
              fetch(`${ACTIONS_API_URL}?source_chapter_id=${chapter.id}`, { headers })
                  .then(res => res.ok ? res.json() : [])
                  .catch(() => { console.error(/*...*/); return []; })
          );
          const actionsResults = await Promise.all(actionPromises);
          

          chaptersData = chaptersData.map((chapter, index) => ({
              ...chapter,
              actions: actionsResults[index] || []  
          }));
          
        }

        setChapters(chaptersData || []);  
        

      } catch (error: unknown) {  
          if (error instanceof Error) {
              console.error("Ошибка при загрузке данных истории:", error);
              setLoadError(error.message || "Не удалось загрузить данные истории.");
          } else {
              console.error("Неизвестная ошибка при загрузке данных истории:", error);
              setLoadError("Не удалось загрузить данные истории.");
          }
      } finally {
        setIsLoadingData(false);
        
      }
    };
    if (storyIdNum && !isNaN(storyIdNum)) {
      loadStoryData(storyIdNum);
    } else {
      setTitle('');
      setDescription('');
      setGenre(genres[0]);
      setChapters([]);
      setCharacters([]);
      setCurrentStoryId(null);
      setIsLoadingData(false);
      setLoadError(null);
    }
  }, [storyId]);

  const addCharacter = () => {
    const newCharacter: StoryCharacter = {
      id: `char-${Date.now()}`,
      name: `Новый персонаж ${characters.length + 1}`,
      description: ''
    };
    setCharacters(prev => [...prev, newCharacter]);
    startEditingCharacter(newCharacter);
  };

  const startEditingCharacter = (character: StoryCharacter) => {
    cancelEditingChapter();
    setEditingCharacterId(character.id);
    setCurrentCharacterName(character.name);
    setCurrentCharacterDescription(character.description || '');
  };

  const handleCharacterChange = (field: 'name' | 'description', value: string) => {
    if (field === 'name') setCurrentCharacterName(value);
    else setCurrentCharacterDescription(value);
  };

  const saveCharacterChanges = () => {
    if (!editingCharacterId) return;
    setCharacters(prevChars =>
      prevChars.map(char =>
        char.id === editingCharacterId
          ? { ...char, name: currentCharacterName, description: currentCharacterDescription }
          : char
      )
    );
    cancelCharacterEditing();
  };

  const cancelCharacterEditing = () => {
    setEditingCharacterId(null);
  };

  const handleDeleteCharacter = async (characterIdToDelete: string | number) => {
    if (typeof characterIdToDelete === 'string' && characterIdToDelete.startsWith('char-')) {
        setCharacters(prevChars => prevChars.filter(char => char.id !== characterIdToDelete));
        if (editingCharacterId === characterIdToDelete) { cancelCharacterEditing(); }
        
        return;
    }

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) { alert("Ошибка: Вы не авторизованы."); return; }
    if (!window.confirm(`Вы уверены, что хотите удалить персонажа ID ${characterIdToDelete}?`)) { return; }

    try {
         const response = await fetch(`${CHARACTERS_API_URL}${characterIdToDelete}/`, {
             method: 'DELETE',
             headers: { 'Authorization': `Bearer ${accessToken}` }
         });
         if (response.ok || response.status === 204) {
             
             setCharacters(prevChars => prevChars.filter(char => char.id !== characterIdToDelete));
             if (editingCharacterId === characterIdToDelete) { cancelCharacterEditing(); }
         } else {
             const errorData = await response.json().catch(() => ({}));
             console.error(`Ошибка удаления персонажа ${characterIdToDelete} (${response.status}):`, errorData);
             alert(`Не удалось удалить персонажа: ${errorData?.detail || response.statusText}`);
         }
    } catch (error) {
         console.error("Сетевая ошибка при удалении персонажа:", error);
         alert("Произошла сетевая ошибка при удалении персонажа.");
    }
  };

  const addChapter = () => {
    const newChapter: StoryChapter = {
      id: `chap-${Date.now()}`,
      title: `Новая глава ${chapters.length + 1}`,
      content: '',
      actions: []
    };
    setChapters(prev => [...prev, newChapter]);
    startEditingChapter(newChapter);
  };

  const handleDeleteChapter = async (chapterIdToDelete: string | number) => {  
    
    if (typeof chapterIdToDelete === 'string' && chapterIdToDelete.startsWith('chap-')) {
        setChapters(prevChapters => prevChapters.filter(chapter => chapter.id !== chapterIdToDelete));
        if (editingChapterId === chapterIdToDelete) {
            cancelEditingChapter();
        }
        
        return;  
    }
     
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) { alert("Ошибка: Вы не авторизованы."); return; }

    if (!window.confirm(`Вы уверены, что хотите удалить главу ID ${chapterIdToDelete}? Это действие необратимо.`)) {
         return;
    }

    try {
         const response = await fetch(`${CHAPTERS_API_URL}${chapterIdToDelete}/`, {
             method: 'DELETE',
             headers: { 'Authorization': `Bearer ${accessToken}` }
         });

         if (response.ok || response.status === 204) { 
             
              
             setChapters(prevChapters => prevChapters.filter(chapter => chapter.id !== chapterIdToDelete));
             if (editingChapterId === chapterIdToDelete) {
                 cancelEditingChapter();
             }
              
         } else {
              
             const errorData = await response.json().catch(() => ({}));  
             console.error(`Ошибка удаления главы ${chapterIdToDelete} с сервера (${response.status}):`, errorData);
             alert(`Не удалось удалить главу: ${errorData?.detail || response.statusText}`);
         }
    } catch (error) {
         console.error("Сетевая ошибка при удалении главы:", error);
         alert("Произошла сетевая ошибка при удалении главы.");
    }
  };

  const startEditingChapter = (chapter: StoryChapter) => {
    cancelCharacterEditing();
    setEditingChapterId(chapter.id);
    setCurrentChapterTitle(chapter.title);
    setCurrentChapterContent(chapter.content);
    setCurrentChapterActions([...chapter.actions]);
  };

  const saveChapterChanges = () => {
    if (!editingChapterId) return;

 
    console.log('--- [saveChapterChanges] Сохранение главы. currentChapterActions:', JSON.stringify(currentChapterActions, null, 2));

    setChapters(prevChapters =>
      prevChapters.map(chap => {
        if (chap.id === editingChapterId) {
 
           console.log(`--- [saveChapterChanges] Обновление главы ${chap.id}. Копируемые actions:`, JSON.stringify(currentChapterActions, null, 2));
           const updatedChapter = {
              ...chap,
              title: currentChapterTitle,
              content: currentChapterContent,
              actions: [...currentChapterActions]  
            };
 
            console.log(`--- [saveChapterChanges] Итоговый объект главы ${chap.id}:`, JSON.stringify(updatedChapter, null, 2));
            return updatedChapter;
        }
        return chap;
      })
    );
    cancelEditingChapter();  
  };

  const cancelEditingChapter = () => {
    setEditingChapterId(null);
    setCurrentChapterActions([]);
  };

  const addActionToCurrentChapter = () => {
    if (!editingChapterId) return;
    const newAction: StoryAction = { id: `action-${Date.now()}`, text: 'Новое действие', nextChapterId: null };
    setCurrentChapterActions(prev => [...prev, newAction]);
  };

  const handleActionChange = (actionId: string, field: keyof Omit<StoryAction, 'id'>, value: string | null) => {
    setCurrentChapterActions(prev =>
      prev.map(action =>
        action.id === actionId ? { ...action, [field]: value } : action
      )
    );
  };

  const handleDeleteAction = async (actionIdToDelete: string | number) => {
    
    if (typeof actionIdToDelete === 'string' && actionIdToDelete.startsWith('action-')) {
        setCurrentChapterActions(prevActions => prevActions.filter(action => action.id !== actionIdToDelete));
        
        return;
    }

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) { alert("Ошибка: Вы не авторизованы."); return; }
    try {
        const response = await fetch(`${ACTIONS_API_URL}${actionIdToDelete}/`, {  
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok || response.status === 204) {
             setCurrentChapterActions(prevActions => prevActions.filter(action => action.id !== actionIdToDelete));
 
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Ошибка удаления действия ${actionIdToDelete} (${response.status}):`, errorData);
            alert(`Не удалось удалить действие: ${errorData?.detail || response.statusText}`);
        }
    } catch (error) {
         console.error("Сетевая ошибка при удалении действия:", error);
         alert("Произошла сетевая ошибка при удалении действия.");
    }
  };

  const handleSave = async () => {
 
    if (editingChapterId) {
      setChapters(prev =>
        prev.map(chap =>
          chap.id === editingChapterId
            ? {
                ...chap,
                title: currentChapterTitle,
                content: currentChapterContent,
                actions: [...currentChapterActions],
              }
            : chap
        )
      );
      cancelEditingChapter();
    }
  
    setIsSaving(true);
    setSaveError(null);
  
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      alert("Ошибка: Вы не авторизованы.");
      setIsSaving(false);
      return;
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
  
    try {
       
      const storyPayload = {
        title: title.trim(),
        description: description.trim(),
        genre,
      };
      const storyRes = await fetch(
        currentStoryId
          ? `${STORIES_API_URL}${currentStoryId}/`
          : STORIES_API_URL,
        {
          method: currentStoryId ? "PATCH" : "POST",
          headers,
          body: JSON.stringify(storyPayload),
        }
      );
      if (!storyRes.ok) {
        throw new Error(`Ошибка сохранения истории (${storyRes.status})`);
      }
      const storyData = await storyRes.json();
      const savedStoryId = storyData.id;
      if (!currentStoryId) {
        setCurrentStoryId(savedStoryId);
      }
 
    const savedChapters: StoryChapter[] = [];  
    const chaptersToProcess = [...chapters];  

    for (const chap of chaptersToProcess) { 
        const isNew = typeof chap.id === "string" && chap.id.startsWith("chap-");
 
        const chapPayload: { title: string; content: string; story?: number } = {
            title: chap.title,
            content: chap.content,
            ...(isNew ? { story: savedStoryId } : {}),  
        };

        console.log(` -> Отправка ${isNew ? "POST" : "PATCH"} для главы ID ${chap.id}`);
        const chapRes = await fetch(
            isNew ? CHAPTERS_API_URL : `${CHAPTERS_API_URL}${chap.id}/`,
            {
                method: isNew ? "POST" : "PATCH",
                headers,
                body: JSON.stringify(chapPayload),
            }
        );

        if (!chapRes.ok) {
             const errorData = await chapRes.json().catch(() => ({}));
             console.error(`Ошибка сохранения главы ID ${chap.id} (${chapRes.status}):`, errorData);
              
             continue;  
        }

 
        const savedChapDataFromBackend = await chapRes.json();

 
        let finalActionsForChapter: StoryAction[];
        if(chap.id === editingChapterId) {
 
            finalActionsForChapter = [...currentChapterActions];
            console.log(` --> Для главы ${savedChapDataFromBackend.id} взяты actions из currentChapterActions`);
        } else {
 
            finalActionsForChapter = [...chap.actions];
        }
 
        savedChapters.push({
            ...savedChapDataFromBackend,  
            actions: finalActionsForChapter  
        });
    }
 
    setChapters(savedChapters);
    console.log("Состояние глав обновлено ПОСЛЕ сохранения глав:", savedChapters);
      const savedCharacters: StoryCharacter[] = [];
      for (const char of characters) {
        const isNew = typeof char.id === "string" && char.id.startsWith("char-");
        const charPayload: { name: string; description: string; story?: number } = {
          name: char.name,
          description: char.description || "",
          ...(isNew ? { story: savedStoryId } : {}),
        };
        const charRes = await fetch(
          isNew
            ? CHARACTERS_API_URL
            : `${CHARACTERS_API_URL}${char.id}/`,
          {
            method: isNew ? "POST" : "PATCH",
            headers,
            body: JSON.stringify(charPayload),
          }
        );
        if (!charRes.ok) {
          throw new Error(`Ошибка сохранения персонажа (${charRes.status})`);
        }
        const newChar = await charRes.json();
        savedCharacters.push(newChar);
      }
      setCharacters(savedCharacters);
  
      const finalChapters = [...savedChapters];
      for (const chap of finalChapters) {
        for (const action of chap.actions) {
          const isNewAct =
            typeof action.id === "string" && action.id.startsWith("action-");
          const actPayload: { text: string; target_chapter?: string; source_chapter?: string } = {
            text: action.text,
            ...(action.nextChapterId !== null
              ? { target_chapter: action.nextChapterId }
              : {}),
            ...(isNewAct ? { source_chapter: chap.id } : {}),
          };
          const actRes = await fetch(
            isNewAct
              ? ACTIONS_API_URL
              : `${ACTIONS_API_URL}${action.id}/`,
            {
              method: isNewAct ? "POST" : "PATCH",
              headers,
              body: JSON.stringify(actPayload),
            }
          );
          if (!actRes.ok) {
            throw new Error(`Ошибка сохранения действия (${actRes.status})`);
          }
          const savedAct = await actRes.json();
 
          action.id = savedAct.id;
        }
      }
      setChapters(finalChapters);
  
      alert("История, главы, персонажи и действия успешно сохранены!");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Ошибка при сохранении:", error);
        setSaveError(error.message);
      } else {
        console.error("Неизвестная ошибка при сохранении:", error);
        setSaveError("Произошла неизвестная ошибка при сохранении.");
      }
    } finally {
      setIsSaving(false);
    }
  }
  

  const chapterBeingEdited = chapters.find(chap => chap.id === editingChapterId);
  const characterBeingEdited = characters.find(char => char.id === editingCharacterId);

  if (isLoadingData) return <div className="editor-screen"><h1>Загрузка...</h1></div>;
  if (loadError) return <div className="editor-screen"><h1>Ошибка</h1><p>{loadError}</p><Link to="/">На главную</Link></div>;

  return (
    <div className="editor-screen">
      <h1>{currentStoryId ? 'Редактирование истории' : 'Создание истории'}</h1>
      <div className="story-metadata">
        <h2>Основная информация</h2>
        <div className="form-group"><label htmlFor="story-title">Название:</label><input id="story-title" type="text" value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="form-group"><label htmlFor="story-description">Описание:</label><textarea id="story-description" value={description} onChange={e => setDescription(e.target.value)} rows={4} /></div>
        <div className="form-group"><label htmlFor="story-genre">Жанр:</label><select id="story-genre" value={genre} onChange={e => setGenre(e.target.value)}>{genres.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
      </div>
      <hr />
      <div className="character-editor section-editor">
        <h2>Персонажи ({characters.length})</h2>
        {characters.length === 0 ? <p>Нет персонажей.</p> : <ul className="item-list">{characters.map(char => <li key={char.id} className={char.id === editingCharacterId ? 'editing' : ''}><span>{char.name}</span><div className="item-actions"><button onClick={() => startEditingCharacter(char)}>✏️</button><button onClick={() => handleDeleteCharacter(char.id)}>🗑️</button></div></li>)}</ul>}
        <button onClick={addCharacter}>Добавить персонажа</button>
        {editingCharacterId && characterBeingEdited && !chapterBeingEdited && <div className="character-edit-form"><hr /><h3>Редактирование: {characterBeingEdited.name}</h3><div className="form-group"><label htmlFor="char-name">Имя:</label><input id="char-name" type="text" value={currentCharacterName} onChange={e => handleCharacterChange('name', e.target.value)} /></div><div className="form-group"><label htmlFor="char-desc">Описание:</label><textarea id="char-desc" value={currentCharacterDescription} onChange={e => handleCharacterChange('description', e.target.value)} rows={3} /></div><div className="edit-form-actions"><button onClick={saveCharacterChanges}>Сохранить</button><button onClick={cancelCharacterEditing}>Отмена</button></div></div>}
      </div>
      <hr />
      <div className="chapters-editor section-editor">
        <h2>Главы ({chapters.length})</h2>
        {chapters.length === 0 ? <p>Нет глав.</p> : <ul className="item-list">{chapters.map(chap => <li key={chap.id} className={chap.id === editingChapterId ? 'editing' : ''}><span>{chap.title}</span><div className="item-actions"><button onClick={() => startEditingChapter(chap)}>✏️</button><button onClick={() => handleDeleteChapter(chap.id)}>🗑️</button></div></li>)}</ul>}
        <button onClick={addChapter}>Добавить главу</button>
        {editingChapterId && chapterBeingEdited && <div className="chapter-edit-form"><hr /><h3>Редактирование: {chapterBeingEdited.title}</h3><div className="form-group"><label htmlFor="chap-title">Название:</label><input id="chap-title" type="text" value={currentChapterTitle} onChange={e => setCurrentChapterTitle(e.target.value)} /></div>
        <div className="form-group"><label htmlFor="chap-content">Текст:</label>
        <textarea id="chap-content" value={currentChapterContent} onChange={e => setCurrentChapterContent(e.target.value)} rows={10} /></div>
        <h4>Действия ({currentChapterActions.length})</h4><div className="actions-list">{currentChapterActions.length === 0 ? <p>Нет действий.</p> : 
        <ul className="action-edit-list">
        {currentChapterActions.map((action) => {  
 
            console.log(`--- Рендер select для Action ID: ${action.id}. Ожидаемое value = "${action.nextChapterId}" (тип ${typeof action.nextChapterId})`);
 

            return (  
                <li key={action.id} className="action-item-edit">
                    <input
                        type="text"
                        value={action.text}
                        onChange={(e) => handleActionChange(action.id, 'text', e.target.value)}
                        placeholder="Текст действия..."
                        className="action-text-input"
                    />
                    <select
                        value={action.nextChapterId || ''}
                        onChange={(e) => handleActionChange(action.id, 'nextChapterId', e.target.value || null)}
                        className="action-next-chapter-select"
                    >
                        <option value="">[Конец истории]</option>
                        {chapters
                            .filter(chap => chap.id !== editingChapterId)
                            .map(chap => {
                                 
                                return (
                                    <option key={chap.id} value={String(chap.id)}>
                                        {chap.title}
                                    </option>
                                );
                        })}
                    </select>
                    <button
                        onClick={() => handleDeleteAction(action.id)}
                        className="action-button delete-button small-button"
                        title="Удалить действие"
                    >
                        🗑️
                    </button>
                </li>
            );
        })}
      </ul>}
      </div><button onClick={addActionToCurrentChapter}>Добавить действие</button><div className="edit-form-actions"><button onClick={saveChapterChanges}>Сохранить главу</button>
        <button onClick={cancelEditingChapter}>Отмена</button></div></div>}
      </div>
      <hr />
      <div className="visuals-editor"><h2>Визуальные элементы</h2></div>
      <hr />
      <div className="editor-actions"><button disabled={isSaving}>Предпросмотр</button><button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Сохранение...' : 'Сохранить'}</button></div>
      {saveError && <p className="error-message">{saveError}</p>}
    </div>
  );
}

export default StoryEditorScreen;


