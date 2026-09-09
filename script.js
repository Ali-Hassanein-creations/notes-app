const STORAGE_KEY = 'notes-app-data';

const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const list = document.getElementById('notes-list');

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load notes', e);
    return [];
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes', e);
  }
}

let notes = loadNotes();

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function render() {
  list.innerHTML = '';

  if (notes.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No notes yet. Add one above.';
    list.appendChild(empty);
    return;
  }

  // newest first
  const sorted = [...notes].sort((a, b) => b.createdAt - a.createdAt);

  sorted.forEach(note => {
    const li = document.createElement('li');

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';

    const textDiv = document.createElement('div');
    textDiv.className = 'text';
    textDiv.textContent = note.text;
    textDiv.title = 'Click to edit';
    textDiv.addEventListener('click', () => editNote(note.id, textDiv));

    const timeDiv = document.createElement('div');
    timeDiv.className = 'timestamp';
    timeDiv.textContent = formatTime(note.createdAt);

    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timeDiv);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => deleteNote(note.id));

    li.appendChild(contentDiv);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

function addNote(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  notes.push({
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    text: trimmed,
    createdAt: Date.now()
  });
  saveNotes(notes);
  render();
}

function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  saveNotes(notes);
  render();
}

function editNote(id, textDiv) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.value = note.text;
  editInput.style.width = '100%';
  editInput.style.border = '2px solid var(--border)';
  editInput.style.padding = '6px 8px';
  editInput.style.fontSize = '14px';

  textDiv.replaceWith(editInput);
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  function commit() {
    const newText = editInput.value.trim();
    if (newText) {
      note.text = newText;
      saveNotes(notes);
    }
    render();
  }

  editInput.addEventListener('blur', commit);
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') editInput.blur();
    if (e.key === 'Escape') render();
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  addNote(input.value);
  input.value = '';
  input.focus();
});

render();
