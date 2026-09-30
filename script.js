const STORAGE_KEY = 'notes-app-data';

const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const urgencyInput = document.getElementById('urgency-input');
const urgencyValue = document.getElementById('urgency-value');
const dailyInput = document.getElementById('daily-input');
const list = document.getElementById('notes-list');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

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

// Old notes had no urgency; default them to 3.
let notes = loadNotes().map(n => ({ urgency: 3, daily: false, doneOn: null, ...n }));

const today = () => new Date().toDateString();

// Daily items only count as done if they were ticked today, so they untick themselves at midnight.
const isDone = note => note.daily ? note.doneOn === today() : !!note.doneOn;

function update() {
  saveNotes(notes);
  render();
}

function render() {
  list.innerHTML = '';

  const done = notes.filter(isDone).length;
  progressBar.style.width = notes.length ? (done / notes.length * 100) + '%' : '0';
  progressText.textContent = notes.length ? `${done} of ${notes.length} done` : '';

  if (notes.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Nothing to do yet. Add a task above.';
    list.appendChild(empty);
    return;
  }

  notes.forEach(note => {
    const li = document.createElement('li');
    li.className = `u${note.urgency}` + (isDone(note) ? ' done' : '');
    li.draggable = true;
    li.dataset.id = note.id;

    const handle = document.createElement('span');
    handle.className = 'handle';
    handle.textContent = '⋮⋮';
    handle.title = 'Drag to move';

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = isDone(note);
    check.addEventListener('change', () => {
      note.doneOn = check.checked ? today() : null;
      update();
    });

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';

    const textDiv = document.createElement('div');
    textDiv.className = 'text';
    textDiv.textContent = note.text;
    textDiv.title = 'Click to edit';
    textDiv.addEventListener('click', () => editNote(note, textDiv));

    const meta = document.createElement('div');
    meta.className = 'meta';

    const meter = document.createElement('span');
    meter.className = 'meter';
    meter.title = 'Urgency ' + note.urgency + ' — click to change';
    for (let i = 1; i <= 5; i++) {
      const bar = document.createElement('span');
      if (i <= note.urgency) bar.className = 'on';
      bar.addEventListener('click', () => { note.urgency = i; update(); });
      meter.appendChild(bar);
    }

    const dailyBtn = document.createElement('button');
    dailyBtn.className = 'daily-btn' + (note.daily ? ' active' : '');
    dailyBtn.textContent = note.daily ? '↻ Daily' : '↻ Once';
    dailyBtn.title = 'Toggle daily reset';
    dailyBtn.addEventListener('click', () => {
      const wasDone = isDone(note);
      note.daily = !note.daily;
      note.doneOn = wasDone ? today() : null;
      update();
    });

    meta.append(meter, dailyBtn);
    contentDiv.append(textDiv, meta);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete';
    deleteBtn.addEventListener('click', () => {
      notes = notes.filter(n => n !== note);
      update();
    });

    li.append(handle, check, contentDiv, deleteBtn);
    list.appendChild(li);
  });
}

// Drag to reorder: move the dragged item live, then save the new order on drop.
let dragged = null;
list.addEventListener('dragstart', e => {
  dragged = e.target.closest?.('li');
  dragged?.classList.add('dragging');
});
list.addEventListener('dragover', e => {
  e.preventDefault();
  const over = e.target.closest('li');
  if (!dragged || !over || over === dragged) return;
  const { top, height } = over.getBoundingClientRect();
  over[e.clientY > top + height / 2 ? 'after' : 'before'](dragged);
});
list.addEventListener('dragend', () => {
  if (!dragged) return;
  const order = [...list.children].map(li => li.dataset.id);
  notes.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  dragged = null;
  update();
});

function editNote(note, textDiv) {
  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'edit-input';
  editInput.value = note.text;

  textDiv.replaceWith(editInput);
  editInput.focus();

  editInput.addEventListener('blur', () => {
    const newText = editInput.value.trim();
    if (newText) note.text = newText;
    update();
  });
  editInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') editInput.blur();
    if (e.key === 'Escape') render();
  });
}

urgencyInput.addEventListener('input', () => {
  urgencyValue.textContent = urgencyInput.value;
  urgencyValue.className = 'badge u' + urgencyInput.value;
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  notes.push({
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    text,
    urgency: Number(urgencyInput.value),
    daily: dailyInput.checked,
    doneOn: null,
    createdAt: Date.now()
  });
  update();
  input.value = '';
  input.focus();
});

// Re-check daily resets when you come back to the tab (e.g. left open overnight).
window.addEventListener('focus', render);

// And refresh right at midnight if the page is open on screen.
(function scheduleMidnight() {
  const midnight = new Date();
  midnight.setHours(24, 0, 1, 0);
  setTimeout(() => { render(); scheduleMidnight(); }, midnight - Date.now());
})();

render();
