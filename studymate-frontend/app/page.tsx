'use client';

import { useRef, useState, useEffect, FormEvent } from 'react';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ filename: string; chunkIndex: number }>;
};

type UploadedFile = {
  id: number;
  name: string;
  status: string;
};

type Task = {
  id: string;
  title: string;
  due_date: string;
  created_at?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const suggestions = [
  {
    icon: '⌕',
    title: 'Explain my documents',
    description: 'Understand difficult concepts in your PDFs',
    prompt: 'Explain the main concepts in my uploaded documents.',
  },
  {
    icon: '✦',
    title: 'Create a study plan',
    description: 'Organize my upcoming study sessions',
    prompt: 'Help me create a study plan for my upcoming exams.',
  },
  {
    icon: '▤',
    title: 'Summarize a topic',
    description: 'Get a clear and simple summary',
    prompt: 'Summarize the main topics in my uploaded documents.',
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'tasks'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks();
    }
  }, [activeTab]);

  async function fetchTasks() {
    setLoadingTasks(true);
    try {
      const response = await fetch(`${API_URL}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoadingTasks(false);
    }
  }

  async function sendMessage(
    event?: FormEvent,
    customMessage?: string,
  ) {
    event?.preventDefault();

    const message = (customMessage ?? input).trim();

    if (!message || loading) return;

    setError('');
    setInput('');

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: 'user',
        content: message,
      },
    ]);

    setLoading(true);

    try {
      // Use the documents/ask endpoint if we have files, otherwise use ai/chat
      const endpoint = files.length > 0 ? '/documents/ask' : '/ai/chat';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: message }),
      });

      if (!response.ok) {
        throw new Error('Unable to get a response from StudyMate.');
      }

      const data = await response.json();

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.answer || 'I could not generate an answer.',
          sources: data.sources,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      event.target.value = '';
      return;
    }

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `${API_URL}/documents/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error('File upload failed.');
      }

      const data = await response.json();

      setFiles((previous) => [
        ...previous,
        {
          id: Date.now(),
          name: file.name,
          status: 'Uploaded',
        },
      ]);

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content:
            data.message ||
            `Your file "${file.name}" was uploaded successfully. You can now ask me questions about it.`,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Upload failed.',
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function createTask(event: FormEvent) {
    event.preventDefault();

    if (!newTaskTitle.trim() || !newTaskDueDate) {
      setError('Please fill in all fields');
      return;
    }

    setCreatingTask(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          dueDate: newTaskDueDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const data = await response.json();
      setTasks((prev) => [...prev, data].sort((a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      ));
      setNewTaskTitle('');
      setNewTaskDueDate('');
      taskInputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  }

  function startNewChat() {
    setMessages([]);
    setInput('');
    setError('');
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }

  function isOverdue(dateString: string) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  return (
    <main className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✦</div>
          <span>StudyMate<span className="brand-ai"> AI</span></span>
        </div>

        <button className="new-chat-btn" onClick={startNewChat}>
          <span>＋</span> New conversation
        </button>

        <div className="sidebar-section">
          <p className="section-label">WORKSPACE</p>

          <button
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <span>◈</span> AI Assistant
          </button>

          <button
            className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <span>▤</span> My Documents
          </button>

          <button
            className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <span>✓</span> Study Tasks
          </button>
        </div>

        <div className="sidebar-section documents-section">
          <p className="section-label">YOUR DOCUMENTS</p>

          {files.length === 0 ? (
            <p className="empty-files">
              Your uploaded files will appear here.
            </p>
          ) : (
            files.map((file) => (
              <div className="document-item" key={file.id}>
                <span className="pdf-icon">PDF</span>
                <span className="document-name">{file.name}</span>
              </div>
            ))
          )}

          <button
            className="upload-sidebar-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '＋ Upload document'}
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-avatar">S</div>
          <div>
            <p className="profile-name">StudyMate User</p>
            <p className="profile-plan">Personal workspace</p>
          </div>
          <span className="profile-menu">···</span>
        </div>
      </aside>

      {/* Main Content */}
      <section className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <span className="breadcrumb-current">
              {activeTab === 'chat' ? 'AI Assistant' :
               activeTab === 'documents' ? 'My Documents' : 'Study Tasks'}
            </span>
          </div>

          <div className="topbar-right">
            <span className="online-dot" />
            <span className="online-label">AI is ready</span>
            <div className="topbar-avatar">S</div>
          </div>
        </header>

        <div className="chat-container">
          <div className="chat-content">
            {activeTab === 'chat' && (
              <>
                {messages.length === 0 ? (
                  <div className="welcome-screen">
                    <div className="welcome-icon">✦</div>
                    <p className="welcome-eyebrow">
                      YOUR PERSONAL AI STUDY PARTNER
                    </p>
                    <h1>
                      Learn smarter.
                      <br />
                      <span>Achieve more.</span>
                    </h1>
                    <p className="welcome-description">
                      Upload your study materials, ask questions,
                      create study plans, and let AI help you stay
                      ahead of your learning goals.
                    </p>
                    <div className="suggestion-grid">
                      {suggestions.map((item) => (
                        <button
                          className="suggestion-card"
                          key={item.title}
                          onClick={() => sendMessage(undefined, item.prompt)}
                          disabled={loading}
                        >
                          <span className="suggestion-icon">
                            {item.icon}
                          </span>
                          <span className="suggestion-title">
                            {item.title}
                          </span>
                          <span className="suggestion-description">
                            {item.description}
                          </span>
                          <span className="suggestion-arrow">↗</span>
                        </button>
                      ))}
                    </div>
                    <button
                      className="upload-main-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <span>＋</span>
                      Upload your first PDF
                    </button>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map((message) => (
                      <div
                        className={`message-row ${message.role}`}
                        key={message.id}
                      >
                        {message.role === 'assistant' && (
                          <div className="message-avatar">✦</div>
                        )}
                        <div className="message-bubble">
                          <p className="message-role">
                            {message.role === 'assistant'
                              ? 'StudyMate AI'
                              : 'You'}
                          </p>
                          <div className="message-text">
                            {message.content}
                          </div>
                          {message.sources && message.sources.length > 0 && (
                            <div className="message-sources">
                              <p className="sources-label">Sources:</p>
                              <ul>
                                {message.sources.map((source, idx) => (
                                  <li key={idx}>
                                    {source.filename} (chunk {source.chunkIndex + 1})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        {message.role === 'user' && (
                          <div className="user-message-avatar">S</div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="message-row assistant">
                        <div className="message-avatar">✦</div>
                        <div className="typing-indicator">
                          <span />
                          <span />
                          <span />
                          <small>StudyMate is thinking...</small>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </>
            )}

            {activeTab === 'documents' && (
              <div className="documents-view">
                <div className="documents-header">
                  <h2>My Documents</h2>
                  <button
                    className="upload-main-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <span>＋</span>
                    {uploading ? 'Uploading...' : 'Upload PDF'}
                  </button>
                </div>
                {files.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">▤</div>
                    <h3>No documents yet</h3>
                    <p>Upload a PDF to start asking questions about your study materials.</p>
                    <button
                      className="upload-main-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <span>＋</span>
                      Upload your first PDF
                    </button>
                  </div>
                ) : (
                  <div className="documents-grid">
                    {files.map((file) => (
                      <div className="document-card" key={file.id}>
                        <div className="doc-icon">PDF</div>
                        <div className="doc-info">
                          <p className="doc-name">{file.name}</p>
                          <p className="doc-status">{file.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="tasks-view">
                <div className="tasks-header">
                  <h2>Study Tasks</h2>
                </div>
                <form className="task-form" onSubmit={createTask}>
                  <div className="task-form-row">
                    <input
                      ref={taskInputRef}
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Task title (e.g., Review Chapter 3)"
                      className="task-input"
                      disabled={creatingTask}
                    />
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="task-date-input"
                      disabled={creatingTask}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <button
                      type="submit"
                      className="task-add-btn"
                      disabled={creatingTask || !newTaskTitle.trim() || !newTaskDueDate}
                    >
                      {creatingTask ? 'Adding...' : 'Add Task'}
                    </button>
                  </div>
                </form>
                {loadingTasks ? (
                  <div className="loading-tasks">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">✓</div>
                    <h3>No tasks yet</h3>
                    <p>Add your first study task above to get organized.</p>
                  </div>
                ) : (
                  <ul className="tasks-list">
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        className={`task-item ${isOverdue(task.due_date) ? 'overdue' : ''}`}
                      >
                        <div className="task-content">
                          <p className="task-title">{task.title}</p>
                          <p className="task-due">
                            Due: {formatDate(task.due_date)}
                            {isOverdue(task.due_date) && ' (OVERDUE)'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {activeTab === 'chat' && (
            <div className="chat-footer">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              <form
                className="chat-input-box"
                onSubmit={(event) => sendMessage(event)}
              >
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask anything about your studies..."
                  rows={1}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={loading}
                />
                <div className="input-actions">
                  <div className="input-left-actions">
                    <button
                      type="button"
                      className="attach-btn"
                      title="Upload PDF"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading || uploading}
                    >
                      ＋
                    </button>
                    <span className="input-hint">
                      Attach a PDF or ask a question
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="send-btn"
                    disabled={!input.trim() || loading}
                  >
                    ↑
                  </button>
                </div>
              </form>
              <p className="disclaimer">
                StudyMate AI can make mistakes. Verify important information.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Hidden PDF Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={uploadFile}
      />

      {uploading && (
        <div className="upload-status">
          <span className="loader" />
          Uploading your document...
        </div>
      )}

      <style jsx>{`
        .message-sources {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .sources-label {
          font-size: 10px;
          font-weight: 700;
          color: #8a78d9;
          margin: 0 0 6px;
        }
        .message-sources ul {
          margin: 0;
          padding-left: 18px;
          font-size: 11px;
          color: #929bad;
        }
        .message-sources li {
          margin-bottom: 4px;
        }
        .documents-view, .tasks-view {
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
          padding: 20px;
        }
        .documents-header, .tasks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .documents-header h2, .tasks-header h2 {
          font-size: 22px;
          font-weight: 700;
          color: #20283b;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #30384a;
          margin: 0 0 8px;
        }
        .empty-state p {
          color: #8992a5;
          margin: 0 0 24px;
        }
        .documents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .document-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          transition: .2s;
        }
        .document-card:hover {
          border-color: #a898f2;
          box-shadow: 0 4px 20px #7357e811;
        }
        .doc-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          background: #feeaea;
          color: #e85d5d;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 800;
        }
        .doc-info {
          flex: 1;
          min-width: 0;
        }
        .doc-name {
          font-size: 14px;
          font-weight: 600;
          color: #20283b;
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .doc-status {
          font-size: 12px;
          color: #35c58a;
          margin: 0;
        }
        .task-form {
          margin-bottom: 24px;
        }
        .task-form-row {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }
        .task-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e1e4ed;
          border-radius: 10px;
          font-size: 14px;
          color: #30384a;
          transition: .2s;
        }
        .task-input:focus {
          outline: none;
          border-color: #a18ef0;
          box-shadow: 0 0 0 3px #7357e815;
        }
        .task-date-input {
          padding: 12px 16px;
          border: 1px solid #e1e4ed;
          border-radius: 10px;
          font-size: 14px;
          color: #30384a;
          background: white;
          min-width: 180px;
        }
        .task-add-btn {
          padding: 12px 24px;
          background: #7357e8;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          transition: .2s;
          white-space: nowrap;
        }
        .task-add-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }
        .task-add-btn:disabled {
          background: #c9c3e8;
          cursor: not-allowed;
        }
        .tasks-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .task-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          margin-bottom: 12px;
          transition: .2s;
        }
        .task-item:hover {
          border-color: #a898f2;
        }
        .task-item.overdue {
          border-color: #f47c7c;
          background: #fff8f8;
        }
        .task-content {
          flex: 1;
        }
        .task-title {
          font-size: 14px;
          font-weight: 600;
          color: #20283b;
          margin: 0 0 4px;
        }
        .task-due {
          font-size: 12px;
          color: #8992a5;
          margin: 0;
        }
        .task-item.overdue .task-due {
          color: #e85d5d;
          font-weight: 600;
        }
        .loading-tasks {
          text-align: center;
          padding: 40px;
          color: #8992a5;
        }
        @media (max-width: 600px) {
          .task-form-row {
            flex-direction: column;
            align-items: stretch;
          }
          .task-date-input {
            min-width: auto;
          }
          .task-add-btn {
            width: 100%;
          }
          .task-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </main>
  );
}