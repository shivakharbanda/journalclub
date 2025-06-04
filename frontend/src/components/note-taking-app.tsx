import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, ArrowLeft, Trash2, MoreHorizontal, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { createEditor, Editor, Transforms, Element as SlateElement, Descendant } from 'slate';
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { fetcher } from '@/lib/api';
import { CustomElement } from '@/types/slate-custom-types';

// Types - matching your backend structure
interface ApiNote {
  id: number;
  slug: string;
  title: string;
  content: Descendant[];
  text_content: string;
  created_at: string;
  updated_at: string;
  episode: number;
}

interface Note {
  id: number;
  slug?: string;
  title: string;
  content: Descendant[];
  textContent: string;
  createdAt: string;
}

interface CreateNoteData {
  title: string;
  content: Descendant[];
  text_content: string;
}

type ViewType = 'main' | 'editor';

// Props for the main component
interface NotesAppProps {
  episodeSlug: string;
}

// API Functions using your fetcher
const notesApi = {
  async fetchNotes(episodeSlug: string): Promise<ApiNote[]> {
    return fetcher<ApiNote[]>(`/notes/episodes/${episodeSlug}/`);
  },

  async createNote(episodeSlug: string, noteData: CreateNoteData): Promise<ApiNote> {
    return fetcher<ApiNote>(`/notes/episodes/${episodeSlug}/`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  },

  async updateNote(noteSlug: string, noteData: Partial<CreateNoteData>): Promise<ApiNote> {
    return fetcher<ApiNote>(`/notes/${noteSlug}/`, {
      method: 'PUT',
      body: JSON.stringify(noteData),
    });
  },

  async deleteNote(noteSlug: string): Promise<void> {
    return fetcher(`/notes/${noteSlug}/`, {
      method: 'DELETE',
    });
  },
};

// Transform API data to component data
const transformApiNote = (apiNote: ApiNote): Note => ({
  id: apiNote.id,
  slug: apiNote.slug,
  title: apiNote.title,
  content: apiNote.content,
  textContent: apiNote.text_content,
  createdAt: new Date(apiNote.created_at).toLocaleDateString(),
});

// Slate helpers (unchanged)
const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor) as Record<string, unknown> | null;
  return marks ? marks[format] === true : false;
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const LIST_TYPES = ['numbered-list', 'bulleted-list'];

const isBlockActive = (editor: Editor, format: string) => {
  const nodeGen = Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  });
  return !nodeGen.next().done;
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      typeof (n as SlateElement).type === 'string' &&
      LIST_TYPES.includes((n as SlateElement).type as string),
    split: true,
  });

  const newProperties: Partial<SlateElement> = {
    type: (isActive ? 'paragraph' : isList ? 'list-item' : format) as CustomElement['type'],
  };
  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block: SlateElement = {
      type: format as CustomElement['type'],
      children: [],
    };

    Transforms.wrapNodes(editor, block);
  }
};

// Slate components (unchanged)
const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'bulleted-list':
      return <ul {...attributes} className="list-disc ml-4 my-2">{children}</ul>;
    case 'numbered-list':
      return <ol {...attributes} className="list-decimal ml-4 my-2">{children}</ol>;
    case 'list-item':
      return <li {...attributes} className="my-1">{children}</li>;
    case 'heading-one':
      return <h1 {...attributes} className="text-lg font-bold my-3">{children}</h1>;
    case 'heading-two':
      return <h2 {...attributes} className="text-base font-bold my-2">{children}</h2>;
    case 'heading-three':
      return <h3 {...attributes} className="text-sm font-bold my-2">{children}</h3>;
    default:
      return <p {...attributes} className="my-1 text-sm">{children}</p>;
  }
};

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  if (leaf.strikethrough) {
    children = <del>{children}</del>;
  }
  return <span {...attributes}>{children}</span>;
};

// Toolbar components (unchanged)
interface ToolbarButtonProps {
  active: boolean;
  onMouseDown: (event: React.MouseEvent) => void;
  children: React.ReactNode;
  title?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ active, onMouseDown, children, title }) => (
  <button
    type="button"
    className={`p-1.5 rounded text-xs transition-colors ${
      active
        ? 'bg-blue-500 text-white'
        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
    }`}
    onMouseDown={onMouseDown}
    title={title}
  >
    {children}
  </button>
);

interface RichTextEditorProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, disabled = false }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [, forceUpdate] = useState({});

  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);


  const triggerUpdate = () => {
    forceUpdate({});
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;

    switch (event.key) {
      case 'b': {
        event.preventDefault();
        toggleMark(editor, 'bold');
        triggerUpdate();
        break;
      }
      case 'i': {
        event.preventDefault();
        toggleMark(editor, 'italic');
        triggerUpdate();
        break;
      }
      case 'u': {
        event.preventDefault();
        toggleMark(editor, 'underline');
        triggerUpdate();
        break;
      }
    }
  };

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 ${disabled ? 'opacity-50' : ''}`}>
      <Slate 
        editor={editor} 
        initialValue={value} 
        onValueChange={onChange}
      >
        {/* Toolbar */}
        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-2 flex items-center gap-1 flex-wrap">
          <select
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs mr-2"
            disabled={disabled}
            onChange={(e) => {
              const format = e.target.value;
              toggleBlock(editor, format);
              triggerUpdate();
            }}
          >
            <option value="paragraph">Normal</option>
            <option value="heading-one">Heading 1</option>
            <option value="heading-two">Heading 2</option>
            <option value="heading-three">Heading 3</option>
          </select>

          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

          <ToolbarButton
            active={isMarkActive(editor, 'bold')}
            onMouseDown={(e) => {
              e.preventDefault();
              if (!disabled) {
                toggleMark(editor, 'bold');
                triggerUpdate();
              }
            }}
            title="Bold (Ctrl+B)"
          >
            <span className="font-bold">B</span>
          </ToolbarButton>

          <ToolbarButton
            active={isMarkActive(editor, 'italic')}
            onMouseDown={(e) => {
              e.preventDefault();
              if (!disabled) {
                toggleMark(editor, 'italic');
                triggerUpdate();
              }
            }}
            title="Italic (Ctrl+I)"
          >
            <span className="italic">I</span>
          </ToolbarButton>

          <ToolbarButton
            active={isMarkActive(editor, 'underline')}
            onMouseDown={(e) => {
              e.preventDefault();
              if (!disabled) {
                toggleMark(editor, 'underline');
                triggerUpdate();
              }
            }}
            title="Underline (Ctrl+U)"
          >
            <span className="underline">U</span>
          </ToolbarButton>

          <ToolbarButton
            active={isMarkActive(editor, 'strikethrough')}
            onMouseDown={(e) => {
              e.preventDefault();
              if (!disabled) {
                toggleMark(editor, 'strikethrough');
                triggerUpdate();
              }
            }}
            title="Strikethrough"
          >
            <span className="line-through">S</span>
          </ToolbarButton>

          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

          <ToolbarButton
            active={isBlockActive(editor, 'bulleted-list')}
            onMouseDown={(e) => {
              e.preventDefault();
              if (!disabled) {
                toggleBlock(editor, 'bulleted-list');
                triggerUpdate();
              }
            }}
            title="Bullet List"
          >
            <span>•</span>
          </ToolbarButton>

          <ToolbarButton
            active={isBlockActive(editor, 'numbered-list')}
            onMouseDown={(e) => {
              e.preventDefault();
              if (!disabled) {
                toggleBlock(editor, 'numbered-list');
                triggerUpdate();
              }
            }}
            title="Numbered List"
          >
            <span>1.</span>
          </ToolbarButton>
        </div>

        {/* Editor */}
        <Editable
          className="bg-white dark:bg-gray-800 min-h-48 p-3 text-gray-900 dark:text-gray-100 text-sm leading-relaxed focus:outline-none"
          style={{ minHeight: '200px' }}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Start writing your note..."
          onKeyDown={handleKeyDown}
          readOnly={disabled}
        />
      </Slate>
    </div>
  );
};

// Helper to extract text content from Slate value
const getTextContent = (nodes: Descendant[]): string => {
  return nodes.map(n => {
    if ('children' in n) {
      return getTextContent(n.children);
    }
    return 'text' in n ? n.text : '';
  }).join('\n');
};

// Error display component
interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => (
  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm font-medium">Error</span>
    </div>
    <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-2 text-sm text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1"
      >
        <RefreshCw className="w-3 h-3" />
        Retry
      </button>
    )}
  </div>
);

// Header component
interface NotesHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  loading?: boolean;
  onRefresh?: () => void;
}

const NotesHeader: React.FC<NotesHeaderProps> = ({ title, onBack, showBack = false, loading = false, onRefresh }) => (
  <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-2">
      {showBack && (
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          type="button"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      <span className="font-medium text-sm">{title}</span>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
    </div>
    <div className="flex items-center gap-1">
      {onRefresh && (
        <button 
          onClick={onRefresh}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          type="button"
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" type="button">
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// Note editor component
interface NoteEditorProps {
  note: Partial<Note>;
  onSave: (note: CreateNoteData) => Promise<void>;
  onDelete?: (slug: string) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onDelete, onBack, loading = false }) => {
  const [title, setTitle] = useState(note.title || 'New Note');
  const defaultContent: Descendant[] = [
    { type: 'paragraph', children: [{ text: '' }] } as CustomElement
  ];
  const [content, setContent] = useState<Descendant[]>(note.content || defaultContent);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    const textContent = getTextContent(content);
    if (!textContent.trim() && title.trim() === 'New Note') {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title,
        content,
        text_content: textContent,
      });
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note.slug || !onDelete) return;
    
    setDeleting(true);
    try {
      await onDelete(note.slug);
    } catch (error) {
      console.error('Failed to delete note:', error);
    } finally {
      setDeleting(false);
    }
  };

  const isDisabled = loading || saving || deleting;

  return (
    <div className="h-full bg-white dark:bg-gray-800">
      <NotesHeader title="Note" onBack={onBack} showBack loading={loading || saving || deleting} />
      
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium border border-gray-200 dark:border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Note title"
            disabled={isDisabled}
          />
          {note.slug && onDelete && (
            <button 
              onClick={handleDelete}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
              type="button"
              disabled={isDisabled}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        <RichTextEditor value={content} onChange={setContent} disabled={isDisabled} />

        <button
          onClick={handleSave}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-2 rounded text-sm font-medium disabled:cursor-not-allowed flex items-center justify-center gap-2"
          type="button"
          disabled={isDisabled}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Note'
          )}
        </button>
      </div>
    </div>
  );
};

// Note card component
interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (slug: string) => Promise<void>;
  loading?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onDelete, loading = false }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note.slug) return;
    
    setDeleting(true);
    try {
      await onDelete(note.slug);
    } catch (error) {
      console.error('Failed to delete note:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${loading || deleting ? 'opacity-50' : ''}`}
      onClick={() => !loading && !deleting && onEdit(note)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm mb-1 truncate">{note.title}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2 mb-2">
            {note.textContent.substring(0, 80)}
            {note.textContent.length > 80 ? '...' : ''}
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-500">{note.createdAt}</span>
        </div>
        <button
          onClick={handleDelete}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded ml-2 flex-shrink-0 disabled:opacity-50"
          type="button"
          disabled={loading || deleting}
        >
          {deleting ? (
            <Loader2 className="w-3 h-3 animate-spin text-gray-500 dark:text-gray-400" />
          ) : (
            <Trash2 className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
};

// Main app component
const NotesApp: React.FC<NotesAppProps> = ({ episodeSlug }) => {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Partial<Note>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load notes on mount
  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiNotes = await notesApi.fetchNotes(episodeSlug);
      const transformedNotes = apiNotes.map(transformApiNote);
      setNotes(transformedNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [episodeSlug]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleAddNote = () => {
    setCurrentNote({});
    setCurrentView('editor');
  };

  const handleEditNote = (note: Note) => {
    setCurrentNote(note);
    setCurrentView('editor');
  };

  const handleSaveNote = async (noteData: CreateNoteData) => {
    if (currentNote.slug) {
      // Update existing note
      const updatedApiNote = await notesApi.updateNote(currentNote.slug, noteData);
      const updatedNote = transformApiNote(updatedApiNote);
      setNotes(prev => prev.map(note => 
        note.slug === currentNote.slug ? updatedNote : note
      ));
    } else {
      // Create new note
      const newApiNote = await notesApi.createNote(episodeSlug, noteData);
      const newNote = transformApiNote(newApiNote);
      setNotes(prev => [newNote, ...prev]);
    }
    
    setCurrentView('main');
    setCurrentNote({});
  };

  const handleDeleteNote = async (slug: string) => {
    await notesApi.deleteNote(slug);
    setNotes(prev => prev.filter(note => note.slug !== slug));
    if (currentNote.slug === slug) {
      setCurrentView('main');
      setCurrentNote({});
    }
  };

  const handleBack = () => {
    setCurrentView('main');
    setCurrentNote({});
  };

  if (currentView === 'editor') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden h-full">
        <NoteEditor
          note={currentNote}
          onSave={handleSaveNote}
          onDelete={currentNote.slug ? handleDeleteNote : undefined}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
      <NotesHeader 
        title="Notes" 
        loading={loading}
        onRefresh={loadNotes}
      />

      <div className="p-3 space-y-3">
        <button
          onClick={handleAddNote}
          className="w-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-50"
          type="button"
          disabled={loading}
        >
          <Plus className="w-4 h-4" />
          <span>Add note</span>
        </button>

        {error && (
          <ErrorDisplay error={error} onRetry={loadNotes} />
        )}

        {loading && notes.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Your Notes</h3>
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                loading={loading}
              />
            ))}
          </div>
        ) : !error && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No notes yet. Create your first note!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default NotesApp;