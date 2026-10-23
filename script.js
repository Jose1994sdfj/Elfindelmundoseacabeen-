const mainScreen = document.getElementById('mainScreen');
const customDatePanel = document.getElementById('customDatePanel');

const daysElement = document.getElementById('days');
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const targetDateElement = document.getElementById('targetDate');
const statusTextElement = document.getElementById('statusText');
const calendarGrid = document.getElementById('calendarGrid');
const monthLabel = document.getElementById('monthLabel');
const resetButton = document.getElementById('resetButton');
const seasonPanel = document.getElementById('seasonPanel');
const seasonIcon = document.getElementById('seasonIcon');
const seasonName = document.getElementById('seasonName');
const seasonMessage = document.getElementById('seasonMessage');
const seasonProgress = document.getElementById('seasonProgress');
const nextSeasonText = document.getElementById('nextSeasonText');
const annualEventsList = document.getElementById('annualEventsList');
const previousMonthButton = document.getElementById('previousMonthButton');
const nextMonthButton = document.getElementById('nextMonthButton');
const mainNoteInput = document.getElementById('mainNoteInput');
const mainNoteDate = document.getElementById('mainNoteDate');
const mainNotePreview = document.getElementById('mainNotePreview');
const dayNoteForm = document.getElementById('dayNoteForm');
const noteCharacterCount = document.getElementById('noteCharacterCount');
const notesCount = document.getElementById('notesCount');
const notesSearch = document.getElementById('notesSearch');
const savedNotesList = document.getElementById('savedNotesList');
const mainForm = document.getElementById('mainForm');
const toggleMainForm = document.getElementById('toggleMainForm');
const mainFormFields = document.getElementById('mainFormFields');
const mainDateInput = document.getElementById('mainDate');
const mainTimeInput = document.getElementById('mainTime');
const mainFormState = document.getElementById('mainFormState');

const customForm = document.getElementById('customForm');
const toggleAnnualEvents = document.getElementById('toggleAnnualEvents');
const toggleCustomDate = document.getElementById('toggleCustomDate');
const annualEventsContent = document.getElementById('annualEventsList');
const customDateContent = document.getElementById('customDateContent');
const customDateInput = document.getElementById('customDate');
const customTimeInput = document.getElementById('customTime');
const customFormState = document.getElementById('customFormState');
const customTargetDateElement = document.getElementById('customTargetDate');
const customCountdownTextElement = document.getElementById('customCountdownText');
const customCalendarGrid = document.getElementById('customCalendarGrid');
const customMonthLabel = document.getElementById('customMonthLabel');
const previousCustomMonthButton = document.getElementById('previousCustomMonthButton');
const nextCustomMonthButton = document.getElementById('nextCustomMonthButton');

const installButtons = document.querySelectorAll('.install-button');
const themeSwatches = document.querySelectorAll('.theme-swatch');
const CRAYON_COLORS = ['pink', 'yellow', 'blue', 'green', 'orange'];
let deferredPrompt;
let calendarResetYear = Number(localStorage.getItem('calendarResetYear')) || null;
let updateTimer;
let bubbleObserver;
let mainCalendarRenderKey;
let customCalendarRenderKey;
let annualEventsRenderKey;
let mainCalendarDate = new Date();
let customCalendarDate = new Date();
let selectedNoteDate = new Date();
let appliedMainDate;
let appliedCustomDate;

function applyTheme(themeName) {
  const theme = ['pink', 'blue', 'dark'].includes(themeName) ? themeName : 'blue';
  document.body.classList.remove('theme-pink', 'theme-blue', 'theme-dark');
  document.body.classList.add(`theme-${theme}`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    theme === 'dark' ? '#81798f' : theme === 'pink' ? '#fff3f5' : '#eef8fc',
  );

  themeSwatches.forEach((swatch) => {
    const isActive = swatch.dataset.theme === theme;
    swatch.classList.toggle('active', isActive);
    swatch.setAttribute('aria-pressed', String(isActive));
  });

  localStorage.setItem('notebookTheme', theme);
}

const SEASON_NAMES = {
  spring: { name: 'Primavera', icon: '✿', message: 'La página despierta: brotes, colores suaves y días que se alargan.' },
  summer: { name: 'Verano', icon: '☀', message: 'El sol toma el cuaderno y la cuenta avanza con luz larga.' },
  autumn: { name: 'Otoño', icon: '🍂', message: 'Las hojas cambian de color y cada día deja una pequeña marca.' },
  winter: { name: 'Invierno', icon: '❄', message: 'El aire se vuelve sereno y las noches guardan más estrellas.' },
};

function getAnnualEvents(year) {
  return [
    { key: 'spring-equinox', date: new Date(year, 2, 20, 12), label: 'Equinoccio de primavera' },
    { key: 'summer-solstice', date: new Date(year, 5, 21, 12), label: 'Solsticio de verano' },
    { key: 'autumn-equinox', date: new Date(year, 8, 22, 12), label: 'Equinoccio de otoño' },
    { key: 'winter-solstice', date: new Date(year, 11, 21, 12), label: 'Solsticio de invierno' },
  ];
}

function getSeasonBoundaries(year) {
  return [
    { key: 'spring', start: new Date(year, 2, 20, 12) },
    { key: 'summer', start: new Date(year, 5, 21, 12) },
    { key: 'autumn', start: new Date(year, 8, 22, 12) },
    { key: 'winter', start: new Date(year, 11, 21, 12) },
  ];
}

function getSeasonInfo(date) {
  const boundaries = [...getSeasonBoundaries(date.getFullYear() - 1), ...getSeasonBoundaries(date.getFullYear()), ...getSeasonBoundaries(date.getFullYear() + 1)]
    .sort((left, right) => left.start - right.start);
  let currentIndex = boundaries.findIndex((boundary, index) => {
    const nextBoundary = boundaries[index + 1];
    return boundary.start <= date && nextBoundary && date < nextBoundary.start;
  });

  if (currentIndex < 0) currentIndex = boundaries.length - 2;

  const current = boundaries[currentIndex];
  const next = boundaries[currentIndex + 1];
  return { ...current, nextStart: next.start, ...SEASON_NAMES[current.key] };
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(date);
}

function isSameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function getCalendarEventsForMonth(year, month, referenceDate) {
  return getAnnualEvents(year).filter((event) => event.date.getFullYear() === year
    && event.date.getMonth() === month)
    .map((event) => ({ ...event, current: isSameDay(event.date, referenceDate) }));
}

function observeBubbleItems(screen) {
  if (!screen || !bubbleObserver) return;

  const items = screen.querySelectorAll(
    '.paper-sheet > header, .paper-sheet > section, .custom-date-panel > section'
  );

  items.forEach((item) => {
    item.classList.add('bubble-reveal');
    bubbleObserver.observe(item);
  });
}

function setupBubbleReveal() {
  if (!('IntersectionObserver' in window)) return;

  const scrollContainer = document.querySelector('.notebook-app');
  bubbleObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('bubble-visible');
      observer.unobserve(entry.target);
    });
  }, {
    root: scrollContainer,
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px',
  });

  observeBubbleItems(mainScreen);
  observeBubbleItems(customDatePanel);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function buildMainDateFromInput() {
  if (!mainDateInput || !mainDateInput.value) return null;

  const [year, month, day] = mainDateInput.value.split('-').map(Number);
  const [hours, minutes] = (mainTimeInput?.value || '12:00').split(':').map(Number);
  const targetDate = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);

  return Number.isNaN(targetDate.getTime()) ? null : targetDate;
}

function getMainTargetDate() {
  return appliedMainDate || new Date();
}

function setDefaultMainDate() {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  mainDateInput.value = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;
  mainTimeInput.value = '12:00';
  localStorage.setItem('mainCountdownDate', mainDateInput.value);
  localStorage.setItem('mainCountdownTime', mainTimeInput.value);
  appliedMainDate = buildMainDateFromInput();
}

function updateDateFormState(element, targetDate, time, hasPendingChanges = false) {
  if (!element || !targetDate) return;

  element.textContent = hasPendingChanges
    ? 'Hay cambios sin aplicar. La cuenta activa no cambiará hasta que confirmes.'
    : `Objetivo activo: ${formatDate(targetDate)} · ${time}.`;
  element.classList.toggle('pending', hasPendingChanges);
}

function getCountdownParts(targetDate) {
  const diff = Math.max(targetDate.getTime() - Date.now(), 0);

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getNoteForDate(date) {
  return localStorage.getItem(`calendarNote-${getDateKey(date)}`) || '';
}

function formatNoteDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function updateNoteCharacterCount() {
  noteCharacterCount.textContent = `${mainNoteInput.value.length} / ${mainNoteInput.maxLength}`;
}

function getMemoryMood(content) {
  const normalizedContent = content
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const moods = [
    { key: 'joy', label: 'Alegría', symbol: '☀', words: ['feliz', 'alegr', 'reimos', 'reir', 'divertid', 'celebr', 'genial', 'sonrei', 'sonrisa'] },
    { key: 'love', label: 'Cariño', symbol: '♡', words: ['amor', 'te quiero', 'te amo', 'abrazo', 'cariño', 'carino', 'familia', 'juntos', 'beso'] },
    { key: 'gratitude', label: 'Gratitud', symbol: '✿', words: ['gracias', 'agradecid', 'agradezco', 'gratitud', 'valoro', 'afortunad'] },
    { key: 'calm', label: 'Calma', symbol: '☾', words: ['paz', 'tranquil', 'calma', 'descanso', 'respirar', 'naturaleza', 'silencio', 'seren'] },
    { key: 'nostalgia', label: 'Nostalgia', symbol: '✧', words: ['recuerdo', 'extraño', 'extrano', 'antes', 'infancia', 'nostalgia', 'memoria', 'volvimos'] },
    { key: 'courage', label: 'Ilusión', symbol: '↗', words: ['logre', 'logro', 'meta', 'sueño', 'sueno', 'empece', 'consegui', 'orgullos', 'avance', 'proyecto'] },
    { key: 'tender', label: 'Un día difícil', symbol: '☁', words: ['triste', 'llore', 'llorar', 'dificil', 'duelo', 'perdi', 'miedo', 'cansad', 'solo', 'preocupa'] },
  ];
  const mood = moods.find((candidate) => candidate.words.some((word) => normalizedContent.includes(word)));

  return mood || { key: 'memory', label: 'Un recuerdo', symbol: '✦' };
}

function renderSavedNotes() {
  const notes = Object.keys(localStorage)
    .filter((key) => key.startsWith('calendarNote-'))
    .map((key) => {
      const dateKey = key.slice('calendarNote-'.length);
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
      if (!match) return null;

      const [, year, month, day] = match;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      const content = localStorage.getItem(key)?.trim();
      if (!content || getDateKey(date) !== dateKey) return null;
      return { dateKey, date, content };
    })
    .filter((note) => note !== null)
    .sort((first, second) => first.date.getTime() - second.date.getTime());

  const query = notesSearch.value.trim().toLocaleLowerCase('es');
  const visibleNotes = notes.filter((note) => (
    `${formatNoteDate(note.date)} ${note.content}`.toLocaleLowerCase('es').includes(query)
  ));
  notesCount.textContent = `${notes.length} ${notes.length === 1 ? 'nota' : 'notas'}`;
  savedNotesList.replaceChildren();

  if (visibleNotes.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'notes-empty-state';
    emptyState.textContent = notes.length === 0
      ? 'Tu libreta está lista. Elige un día del calendario y guarda tu primera nota.'
      : 'No hay notas que coincidan con tu búsqueda.';
    savedNotesList.appendChild(emptyState);
    return;
  }

  visibleNotes.forEach(({ dateKey, date, content }) => {
    const mood = getMemoryMood(content);
    const card = document.createElement('article');
    card.className = `memory-scrap emotion-${mood.key}`;
    if (selectedNoteDate && getDateKey(selectedNoteDate) === dateKey) {
      card.classList.add('selected');
    }

    const dateLabel = document.createElement('time');
    dateLabel.className = 'memory-date';
    dateLabel.dateTime = dateKey;
    dateLabel.textContent = formatNoteDate(date);

    const moodLabel = document.createElement('span');
    moodLabel.className = 'memory-mood';
    moodLabel.textContent = mood.label;

    const memoryMark = document.createElement('span');
    memoryMark.className = 'memory-mark';
    memoryMark.textContent = mood.symbol;
    memoryMark.setAttribute('aria-hidden', 'true');

    const noteContent = document.createElement('p');
    noteContent.className = 'memory-content';
    noteContent.textContent = content;

    const actions = document.createElement('div');
    actions.className = 'saved-note-actions';

    const editButton = document.createElement('button');
    editButton.className = 'note-action-button';
    editButton.type = 'button';
    editButton.dataset.noteAction = 'edit';
    editButton.dataset.noteDate = dateKey;
    editButton.textContent = 'Abrir nota';
    editButton.setAttribute('aria-label', `Editar nota del ${formatNoteDate(date)}`);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'note-action-button delete';
    deleteButton.type = 'button';
    deleteButton.dataset.noteAction = 'delete';
    deleteButton.dataset.noteDate = dateKey;
    deleteButton.textContent = 'Eliminar';
    deleteButton.setAttribute('aria-label', `Eliminar nota del ${formatNoteDate(date)}`);

    actions.append(editButton, deleteButton);
    card.append(memoryMark, dateLabel, moodLabel, noteContent, actions);
    savedNotesList.appendChild(card);
  });
}

function renderCalendar({ grid, label, targetDate, comparisonDate, calendarDate, selectedDate, events = [], onDayClick }) {
  const currentDate = comparisonDate || new Date();
  const displayedDate = calendarDate || currentDate;
  const month = displayedDate.getMonth();
  const year = displayedDate.getFullYear();
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(firstDay);

  if (label) {
    label.textContent = monthName.toLowerCase();
  }

  const weekdayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const calendarCells = [];

  weekdayNames.forEach((day) => {
    calendarCells.push({ empty: false, label: day, dayNumber: null, isHeader: true });
  });

  const emptySlots = (startWeekday + 6) % 7;
  for (let i = 0; i < emptySlots; i += 1) {
    calendarCells.push({ empty: true, label: '', dayNumber: null, isHeader: false });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const calendarDate = new Date(year, month, day, 0, 0, 0, 0);
    const isPast = calendarDate < new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const isToday = calendarDate.getTime() === new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
    const isTarget = targetDate
      && day === targetDate.getDate()
      && month === targetDate.getMonth()
      && year === targetDate.getFullYear();
    const isSelected = selectedDate && isSameDay(calendarDate, selectedDate);
    const event = events.find((item) => isSameDay(item.date, calendarDate));
    const note = getNoteForDate(calendarDate);

    calendarCells.push({
      empty: false,
      label: String(day),
      dayNumber: day,
      isPast,
      isToday,
      isTarget,
      isSelected,
      event,
      note,
      date: calendarDate,
      isHeader: false,
    });
  }

  grid.innerHTML = '';

  calendarCells.forEach((cell) => {
    const cellElement = document.createElement('div');
    cellElement.className = 'calendar-day';

    if (cell.empty) {
      cellElement.classList.add('empty');
      grid.appendChild(cellElement);
      return;
    }

    if (cell.isHeader) {
      cellElement.textContent = cell.label;
      grid.appendChild(cellElement);
      return;
    }

    if (calendarResetYear !== currentDate.getFullYear() && cell.isPast) {
      cellElement.classList.add('crossed');
      const color = CRAYON_COLORS[(cell.dayNumber - 1) % CRAYON_COLORS.length];
      const cross = document.createElement('span');
      cross.className = `crayon-x ${color}`;
      cross.textContent = '✕';
      cellElement.appendChild(cross);
    }

    if (cell.isTarget) {
      cellElement.classList.add('target');
    }

    if (cell.isSelected) {
      cellElement.classList.add('selected');
      cellElement.setAttribute('aria-pressed', 'true');
    } else if (onDayClick) {
      cellElement.setAttribute('aria-pressed', 'false');
    }

    if (cell.isToday) {
      cellElement.style.boxShadow = 'inset 0 0 0 2px rgba(41, 69, 102, 0.35)';
    }

    if (cell.note) {
      cellElement.classList.add('has-note');
      cellElement.title = `Nota guardada: ${cell.note}`;
      cellElement.setAttribute('aria-label', `${cell.dayNumber}, tiene una nota guardada`);
    } else {
      cellElement.setAttribute('aria-label', String(cell.dayNumber));
    }

    const number = document.createElement('span');
    number.className = 'day-number';
    number.textContent = cell.label;
    cellElement.appendChild(number);

    if (onDayClick) {
      cellElement.tabIndex = 0;
      cellElement.setAttribute('role', 'button');
      cellElement.addEventListener('click', () => onDayClick(cell.date));
      cellElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onDayClick(cell.date);
        }
      });
    }

    grid.appendChild(cellElement);
  });
}

function selectNoteDate(date, activeGrid) {
  const note = getNoteForDate(date);
  selectedNoteDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  mainCalendarDate = new Date(date.getFullYear(), date.getMonth(), 1);
  customCalendarDate = new Date(date.getFullYear(), date.getMonth(), 1);
  mainNoteInput.value = note;
  mainNoteDate.textContent = formatNoteDate(selectedNoteDate);
  mainNotePreview.textContent = note ? 'Esta fecha ya tiene una nota. Puedes editarla o eliminarla.' : 'Día listo para agregar una nueva nota.';
  mainNotePreview.classList.toggle('has-note-content', Boolean(note));
  updateNoteCharacterCount();
  mainCalendarRenderKey = undefined;
  customCalendarRenderKey = undefined;
  updateMainCountdown();
  updateCustomCountdown();
  renderSavedNotes();
  activeGrid?.querySelector('.calendar-day.selected')?.focus();
}

function renderMainCalendar(now, targetDate) {
  renderCalendar({
    grid: calendarGrid,
    label: monthLabel,
    targetDate,
    comparisonDate: now,
    calendarDate: mainCalendarDate,
    selectedDate: selectedNoteDate,
    events: getCalendarEventsForMonth(mainCalendarDate.getFullYear(), mainCalendarDate.getMonth(), now),
    onDayClick: (date) => selectNoteDate(date, calendarGrid),
  });
}

function renderCustomCalendar(now, targetDate) {
  renderCalendar({
    grid: customCalendarGrid,
    label: customMonthLabel,
    targetDate,
    comparisonDate: now,
    calendarDate: customCalendarDate,
    selectedDate: selectedNoteDate,
    events: getCalendarEventsForMonth(customCalendarDate.getFullYear(), customCalendarDate.getMonth(), now),
    onDayClick: (date) => selectNoteDate(date, customCalendarGrid),
  });
}

function changeCalendarMonth(calendarName, amount) {
  const currentDate = calendarName === 'main' ? mainCalendarDate : customCalendarDate;
  const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + amount, 1);

  if (calendarName === 'main') {
    mainCalendarDate = nextDate;
    mainCalendarRenderKey = undefined;
    updateMainCountdown();
  } else {
    customCalendarDate = nextDate;
    customCalendarRenderKey = undefined;
    updateCustomCountdown();
  }
}

function updateMainCountdown() {
  const now = new Date();
  const targetDate = getMainTargetDate();
  const countdown = getCountdownParts(targetDate);

  daysElement.textContent = String(countdown.days).padStart(2, '0');
  hoursElement.textContent = String(countdown.hours).padStart(2, '0');
  minutesElement.textContent = String(countdown.minutes).padStart(2, '0');
  secondsElement.textContent = String(countdown.seconds).padStart(2, '0');

  targetDateElement.textContent = `Próximo: ${formatDate(targetDate)}`;
  statusTextElement.textContent = `Faltan ${countdown.days} días, ${countdown.hours} horas, ${countdown.minutes} minutos y ${countdown.seconds} segundos`;
  const calendarKey = `${mainCalendarDate.getFullYear()}-${mainCalendarDate.getMonth()}-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${targetDate.getTime()}-${calendarResetYear}`;
  if (calendarKey !== mainCalendarRenderKey) {
    renderMainCalendar(now, targetDate);
    mainCalendarRenderKey = calendarKey;
  }
  updateSeason(now);

  const annualEventsKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  if (annualEventsKey !== annualEventsRenderKey) {
    renderAnnualEvents(now);
    annualEventsRenderKey = annualEventsKey;
  }

}

function updateSeason(now) {
  const season = getSeasonInfo(now);
  const duration = season.nextStart.getTime() - season.start.getTime();
  const elapsed = now.getTime() - season.start.getTime();
  const progress = Math.min(Math.max((elapsed / duration) * 100, 0), 100);

  seasonPanel.className = `season-panel ${season.key}`;
  seasonIcon.textContent = season.icon;
  seasonName.textContent = season.name;
  seasonMessage.textContent = season.message;
  seasonProgress.style.width = `${progress}%`;
  nextSeasonText.textContent = `Próxima transición: ${formatShortDate(season.nextStart)}`;
}

function renderAnnualEvents(now) {
  const events = getAnnualEvents(now.getFullYear());
  annualEventsList.innerHTML = events.map((event) => `
    <div class="annual-event ${isSameDay(event.date, now) ? 'current' : ''}">
      <time datetime="${event.date.toISOString().slice(0, 10)}">${formatShortDate(event.date)}</time>
      <span>${event.label}</span>
    </div>
  `).join('');
}

function buildCustomDateFromInput() {
  if (!customDateInput || !customDateInput.value) return null;

  const [year, month, day] = customDateInput.value.split('-').map(Number);
  const [hours, minutes] = (customTimeInput && customTimeInput.value ? customTimeInput.value : '00:00').split(':').map(Number);
  const targetDate = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);

  return Number.isNaN(targetDate.getTime()) ? null : targetDate;
}

function updateCustomCountdown() {
  const targetDate = appliedCustomDate;
  const now = new Date();
  const calendarKey = `${customCalendarDate.getFullYear()}-${customCalendarDate.getMonth()}-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${targetDate?.getTime() ?? 'none'}`;

  if (calendarKey !== customCalendarRenderKey) {
    renderCustomCalendar(now, targetDate);
    customCalendarRenderKey = calendarKey;
  }

  if (!targetDate) {
    customTargetDateElement.textContent = 'Fecha personalizada';
    customCountdownTextElement.textContent = 'Elige una fecha para iniciar la cuenta regresiva.';
    return;
  }

  const countdown = getCountdownParts(targetDate);
  customTargetDateElement.textContent = `Próximo: ${formatDate(targetDate)}`;

  if (targetDate.getTime() <= now.getTime()) {
    customCountdownTextElement.textContent = 'La fecha elegida ya pasó. Elige una fecha futura.';
    return;
  }

  customCountdownTextElement.innerHTML = [
    [countdown.days, countdown.days === 1 ? 'día' : 'días'],
    [countdown.hours, 'horas'],
    [countdown.minutes, 'min'],
    [countdown.seconds, 'seg'],
  ].map(([value, label]) => `
    <span class="custom-countdown-part">
      <span class="custom-countdown-number">${value}</span>
      <span class="custom-countdown-unit">${label}</span>
    </span>
  `).join('');
}

function setDefaultCustomDate() {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  const year = futureDate.getFullYear();
  const month = String(futureDate.getMonth() + 1).padStart(2, '0');
  const day = String(futureDate.getDate()).padStart(2, '0');

  customDateInput.value = `${year}-${month}-${day}`;
  customTimeInput.value = '12:00';
  localStorage.setItem('customCountdownDate', customDateInput.value);
  localStorage.setItem('customCountdownTime', customTimeInput.value);
  appliedCustomDate = buildCustomDateFromInput();
  updateCustomCountdown();
}

resetButton?.addEventListener('click', () => {
  calendarResetYear = new Date().getFullYear();
  localStorage.setItem('calendarResetYear', String(calendarResetYear));
  statusTextElement.textContent = 'Cuenta reiniciada. Empieza desde hoy.';
  updateMainCountdown();
});

customForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const selectedDate = buildCustomDateFromInput();

  if (!selectedDate) {
    customFormState.textContent = 'Elige una fecha válida antes de guardar.';
    return;
  }

  localStorage.setItem('customCountdownDate', customDateInput.value);
  localStorage.setItem('customCountdownTime', customTimeInput.value || '00:00');
  appliedCustomDate = selectedDate;
  updateCustomCountdown();
  updateDateFormState(customFormState, appliedCustomDate, customTimeInput.value || '00:00');
});

function markCustomDateDraft() {
  updateDateFormState(customFormState, appliedCustomDate, customTimeInput.value || '00:00', true);
}

customDateInput?.addEventListener('input', markCustomDateDraft);
customTimeInput?.addEventListener('input', markCustomDateDraft);

previousMonthButton?.addEventListener('click', () => changeCalendarMonth('main', -1));
nextMonthButton?.addEventListener('click', () => changeCalendarMonth('main', 1));
previousCustomMonthButton?.addEventListener('click', () => changeCalendarMonth('custom', -1));
nextCustomMonthButton?.addEventListener('click', () => changeCalendarMonth('custom', 1));
dayNoteForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!selectedNoteDate) return;

  const noteKey = `calendarNote-${getDateKey(selectedNoteDate)}`;
  const note = mainNoteInput.value.trim();
  if (note) {
    localStorage.setItem(noteKey, note);
    mainNotePreview.textContent = `Nota guardada para el ${formatNoteDate(selectedNoteDate)}.`;
    mainNotePreview.classList.add('has-note-content');
  } else {
    localStorage.removeItem(noteKey);
    mainNotePreview.textContent = `Nota eliminada para el ${formatNoteDate(selectedNoteDate)}.`;
    mainNotePreview.classList.remove('has-note-content');
  }

  mainCalendarRenderKey = undefined;
  customCalendarRenderKey = undefined;
  updateMainCountdown();
  updateCustomCountdown();
  renderSavedNotes();
});

mainNoteInput?.addEventListener('input', updateNoteCharacterCount);
notesSearch?.addEventListener('input', renderSavedNotes);
savedNotesList?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-note-action]');
  if (!button) return;

  const dateKey = button.dataset.noteDate;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (getDateKey(date) !== dateKey) return;

  if (button.dataset.noteAction === 'delete') {
    localStorage.removeItem(`calendarNote-${dateKey}`);
    if (selectedNoteDate && getDateKey(selectedNoteDate) === dateKey) {
      mainNoteInput.value = '';
      mainNotePreview.textContent = `Nota eliminada para el ${formatNoteDate(date)}.`;
      mainNotePreview.classList.remove('has-note-content');
      updateNoteCharacterCount();
    }
    mainCalendarRenderKey = undefined;
    customCalendarRenderKey = undefined;
    updateMainCountdown();
    updateCustomCountdown();
    renderSavedNotes();
    return;
  }

  if (button.dataset.noteAction === 'edit') {
    mainCalendarDate = new Date(date.getFullYear(), date.getMonth(), 1);
    customCalendarDate = new Date(date.getFullYear(), date.getMonth(), 1);
    selectNoteDate(date);
    mainNoteInput.focus();
  }
});

mainForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const selectedDate = buildMainDateFromInput();

  if (!selectedDate) {
    statusTextElement.textContent = 'Elige una fecha válida antes de aplicar el objetivo.';
    return;
  }

  localStorage.setItem('mainCountdownDate', mainDateInput.value);
  localStorage.setItem('mainCountdownTime', mainTimeInput.value || '12:00');
  appliedMainDate = selectedDate;
  mainCalendarRenderKey = undefined;
  updateMainCountdown();
  updateDateFormState(mainFormState, appliedMainDate, mainTimeInput.value || '12:00');
});

function markMainDateDraft() {
  updateDateFormState(mainFormState, appliedMainDate, mainTimeInput.value || '12:00', true);
}

mainDateInput?.addEventListener('input', markMainDateDraft);
mainTimeInput?.addEventListener('input', markMainDateDraft);

toggleMainForm?.addEventListener('click', () => {
  if (!mainFormFields) return;

  const isExpanded = toggleMainForm.getAttribute('aria-expanded') === 'true';
  toggleMainForm.setAttribute('aria-expanded', String(!isExpanded));
  mainFormFields.hidden = isExpanded;
});

function setupPersistedPanel(toggle, content, storageKey) {
  if (!toggle || !content) return;

  const isExpanded = localStorage.getItem(storageKey) === 'true';
  toggle.setAttribute('aria-expanded', String(isExpanded));
  content.hidden = !isExpanded;

  toggle.addEventListener('click', () => {
    const shouldExpand = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(shouldExpand));
    content.hidden = !shouldExpand;
    localStorage.setItem(storageKey, String(shouldExpand));
  });
}

setupPersistedPanel(toggleAnnualEvents, annualEventsContent, 'annualEventsExpanded-v2');
setupPersistedPanel(toggleCustomDate, customDateContent, 'customDateExpanded-v2');

document.querySelectorAll('.date-shortcut').forEach((button) => {
  button.addEventListener('click', () => {
    const form = button.closest('form');
    const dateInput = form === mainForm ? mainDateInput : customDateInput;
    if (!dateInput) return;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + Number(button.dataset.days));
    dateInput.value = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

    if (form === mainForm) {
      markMainDateDraft();
    } else {
      markCustomDateDraft();
    }
  });
});

themeSwatches.forEach((swatch) => {
  swatch.addEventListener('click', () => applyTheme(swatch.dataset.theme));
});

installButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    button.hidden = true;
  });
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installButtons.forEach((button) => button.hidden = false);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.error('Error al registrar el service worker:', error);
    });
  });
}

const savedCustomDate = localStorage.getItem('customCountdownDate');
const savedMainDate = localStorage.getItem('mainCountdownDate');
applyTheme(localStorage.getItem('notebookTheme') || 'blue');

if (savedMainDate) {
  mainDateInput.value = savedMainDate;
  mainTimeInput.value = localStorage.getItem('mainCountdownTime') || '12:00';
  appliedMainDate = buildMainDateFromInput();
  if (!appliedMainDate) setDefaultMainDate();
} else {
  setDefaultMainDate();
}
updateDateFormState(mainFormState, appliedMainDate, mainTimeInput.value);

if (savedCustomDate) {
  customDateInput.value = savedCustomDate;
  customTimeInput.value = localStorage.getItem('customCountdownTime') || '12:00';
  appliedCustomDate = buildCustomDateFromInput();
  if (!appliedCustomDate) setDefaultCustomDate();
} else {
  setDefaultCustomDate();
}
updateDateFormState(customFormState, appliedCustomDate, customTimeInput.value);

mainNoteDate.textContent = formatNoteDate(selectedNoteDate);
mainNotePreview.textContent = 'Elige un día del calendario o empieza con hoy.';
updateNoteCharacterCount();
renderSavedNotes();
setupBubbleReveal();

function updateAll() {
  updateMainCountdown();
  updateCustomCountdown();
}

function scheduleAccurateUpdate() {
  window.clearTimeout(updateTimer);
  updateAll();

  // Align the next repaint to the real wall-clock second after tab suspension.
  const delay = 1000 - (Date.now() % 1000) + 25;
  updateTimer = window.setTimeout(scheduleAccurateUpdate, delay);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) scheduleAccurateUpdate();
});

window.addEventListener('pageshow', scheduleAccurateUpdate);
window.addEventListener('pagehide', () => window.clearTimeout(updateTimer));

scheduleAccurateUpdate();
