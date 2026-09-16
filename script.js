const mainScreen = document.getElementById('mainScreen');
const customScreen = document.getElementById('customScreen');
const switchToCustom = document.getElementById('switchToCustom');
const switchToMain = document.getElementById('switchToMain');

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
const weeklyMessageTitle = document.getElementById('weeklyMessageTitle');
const weeklyMessageText = document.getElementById('weeklyMessageText');
const weeklyMessageDate = document.getElementById('weeklyMessageDate');
const notificationButton = document.getElementById('notificationButton');
const previousMonthButton = document.getElementById('previousMonthButton');
const nextMonthButton = document.getElementById('nextMonthButton');
const mainNoteInput = document.getElementById('mainNoteInput');
const saveMainNote = document.getElementById('saveMainNote');
const mainNoteDate = document.getElementById('mainNoteDate');
const mainNotePreview = document.getElementById('mainNotePreview');
const mainForm = document.getElementById('mainForm');
const mainDateInput = document.getElementById('mainDate');
const mainTimeInput = document.getElementById('mainTime');

const customForm = document.getElementById('customForm');
const customDateInput = document.getElementById('customDate');
const customTimeInput = document.getElementById('customTime');
const customDaysElement = document.getElementById('customDays');
const customHoursElement = document.getElementById('customHours');
const customMinutesElement = document.getElementById('customMinutes');
const customSecondsElement = document.getElementById('customSeconds');
const customTargetDateElement = document.getElementById('customTargetDate');
const customStatusTextElement = document.getElementById('customStatusText');
const customCalendarGrid = document.getElementById('customCalendarGrid');
const customMonthLabel = document.getElementById('customMonthLabel');
const previousCustomMonthButton = document.getElementById('previousCustomMonthButton');
const nextCustomMonthButton = document.getElementById('nextCustomMonthButton');
const customNoteInput = document.getElementById('customNoteInput');
const saveCustomNote = document.getElementById('saveCustomNote');
const customNoteDate = document.getElementById('customNoteDate');
const customNotePreview = document.getElementById('customNotePreview');

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
let weeklyMessageRenderKey;
let mainCalendarDate = new Date();
let customCalendarDate = new Date();
let selectedMainNoteDate;
let selectedCustomNoteDate;

const WEEKLY_MESSAGES = [
  'No tienes que resolverlo todo hoy: avanzar un poco también cuenta.',
  'Tu esfuerzo de hoy está construyendo algo que mañana agradecerás.',
  'Haz espacio para una pequeña alegría; también es parte del progreso.',
  'Confía en tu ritmo. Lo constante puede ser más poderoso que lo rápido.',
  'Esta semana merece una versión tuya paciente, curiosa y presente.',
  'Una decisión amable contigo puede cambiar el tono de todo el día.',
  'Ya has superado días difíciles. Este también puede traer algo bueno.',
];

function applyTheme(themeName) {
  const theme = ['pink', 'yellow', 'blue'].includes(themeName) ? themeName : 'yellow';
  document.body.classList.remove('theme-pink', 'theme-yellow', 'theme-blue');
  document.body.classList.add(`theme-${theme}`);

  themeSwatches.forEach((swatch) => {
    const isActive = swatch.dataset.theme === theme;
    swatch.classList.toggle('active', isActive);
    swatch.setAttribute('aria-pressed', String(isActive));
  });

  localStorage.setItem('notebookTheme', theme);
}

const SEASON_NAMES = {
  spring: { name: 'Primavera', icon: '⌁', message: 'La página despierta: brotes, colores suaves y días que se alargan.' },
  summer: { name: 'Verano', icon: '◉', message: 'El sol toma el cuaderno y la cuenta avanza con luz larga.' },
  autumn: { name: 'Otoño', icon: '⌘', message: 'Las hojas cambian de color y cada día deja una pequeña marca.' },
  winter: { name: 'Invierno', icon: '◇', message: 'El aire se vuelve sereno y las noches guardan más estrellas.' },
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

function getWeekStart(date) {
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = weekStart.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - daysFromMonday);
  weekStart.setHours(9, 0, 0, 0);
  return weekStart;
}

function getWeekKey(date) {
  return getWeekStart(date).toISOString().slice(0, 10);
}

function getWeeklyMessage(date) {
  const weekStart = getWeekStart(date);
  const firstWeek = new Date(2024, 0, 1, 9);
  const weekNumber = Math.floor((weekStart - firstWeek) / 604800000);
  const message = WEEKLY_MESSAGES[Math.abs(weekNumber) % WEEKLY_MESSAGES.length];

  return {
    key: `weekly-${getWeekKey(date)}`,
    date: weekStart,
    label: 'Mensaje positivo de la semana',
    message,
  };
}

function getCalendarEventsForMonth(year, month, referenceDate) {
  const events = getAnnualEvents(year);
  const cursor = new Date(year, month, 1, 9);

  while (cursor.getMonth() === month) {
    if (cursor.getDay() === 1) {
      const weeklyEvent = getWeeklyMessage(cursor);
      events.push({ ...weeklyEvent, label: `Mensaje semanal: ${weeklyEvent.message}` });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return events.filter((event) => event.date.getFullYear() === year
    && event.date.getMonth() === month)
    .map((event) => ({ ...event, current: isSameDay(event.date, referenceDate) }));
}

function showScreen(screenName) {
  if (mainScreen) mainScreen.classList.toggle('active', screenName === 'main');
  if (customScreen) customScreen.classList.toggle('active', screenName === 'custom');

  const activeScreen = screenName === 'main' ? mainScreen : customScreen;
  window.requestAnimationFrame(() => observeBubbleItems(activeScreen));
}

function observeBubbleItems(screen) {
  if (!screen || !bubbleObserver) return;

  const items = screen.querySelectorAll(
    '.paper-sheet > header, .paper-sheet > section'
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
  observeBubbleItems(customScreen);
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
  return buildMainDateFromInput() || new Date();
}

function setDefaultMainDate() {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  mainDateInput.value = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;
  mainTimeInput.value = '12:00';
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
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function renderCalendar({ grid, label, targetDate, comparisonDate, calendarDate, events = [], onDayClick }) {
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
    const event = events.find((item) => isSameDay(item.date, calendarDate));
    const note = getNoteForDate(calendarDate);

    calendarCells.push({
      empty: false,
      label: String(day),
      dayNumber: day,
      isPast,
      isToday,
      isTarget,
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

    if (cell.isToday) {
      cellElement.style.boxShadow = 'inset 0 0 0 2px rgba(41, 69, 102, 0.35)';
    }

    if (cell.note) {
      cellElement.classList.add('has-note');
      cellElement.title = `Nota: ${cell.note}`;
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

function selectNoteDate(date, input, dateLabel, preview, setter) {
  const note = getNoteForDate(date);
  setter(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
  input.value = note;
  dateLabel.textContent = `Día seleccionado: ${formatNoteDate(date)}`;
  preview.textContent = note ? `Nota guardada: ${note}` : 'Este día todavía no tiene una nota.';
  preview.classList.toggle('has-note-content', Boolean(note));
  input.focus();
}

function renderMainCalendar(now, targetDate) {
  renderCalendar({
    grid: calendarGrid,
    label: monthLabel,
    targetDate,
    comparisonDate: now,
    calendarDate: mainCalendarDate,
    events: getCalendarEventsForMonth(mainCalendarDate.getFullYear(), mainCalendarDate.getMonth(), now),
    onDayClick: (date) => selectNoteDate(date, mainNoteInput, mainNoteDate, mainNotePreview, (value) => { selectedMainNoteDate = value; }),
  });
}

function renderCustomCalendar(now, targetDate) {
  renderCalendar({
    grid: customCalendarGrid,
    label: customMonthLabel,
    targetDate,
    comparisonDate: now,
    calendarDate: customCalendarDate,
    events: getCalendarEventsForMonth(customCalendarDate.getFullYear(), customCalendarDate.getMonth(), now),
    onDayClick: (date) => selectNoteDate(date, customNoteInput, customNoteDate, customNotePreview, (value) => { selectedCustomNoteDate = value; }),
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

  const weeklyMessageKey = getWeekKey(now);
  if (weeklyMessageKey !== weeklyMessageRenderKey) {
    updateWeeklyMessage(now);
    weeklyMessageRenderKey = weeklyMessageKey;
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

function showWeeklyToast(message) {
  document.querySelector('.weekly-toast')?.remove();

  const toast = document.createElement('aside');
  toast.className = 'weekly-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<strong>Mensaje de la semana</strong><span>${message}</span>`;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 8000);
}

async function sendWeeklyNotification(weeklyMessage) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;

  const options = {
    body: weeklyMessage.message,
    icon: './icon-192.svg',
    tag: weeklyMessage.key,
    renotify: false,
  };

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('Tu mensaje de la semana', options);
  } else {
    new Notification('Tu mensaje de la semana', options);
  }

  localStorage.setItem('lastWeeklyNotification', weeklyMessage.key);
  return true;
}

function updateWeeklyMessage(now) {
  const weeklyMessage = getWeeklyMessage(now);
  weeklyMessageTitle.textContent = weeklyMessage.message;
  weeklyMessageText.textContent = 'Un pequeño recordatorio para comenzar con intención.';
  weeklyMessageDate.textContent = `Semana del ${formatDate(weeklyMessage.date)}`;

  const notificationsEnabled = 'Notification' in window && Notification.permission === 'granted';
  notificationButton.classList.toggle('enabled', notificationsEnabled);
  notificationButton.textContent = notificationsEnabled ? 'Avisos activos' : 'Activar avisos';

  if (!localStorage.getItem(`weeklyToast-${weeklyMessage.key}`)) {
    localStorage.setItem(`weeklyToast-${weeklyMessage.key}`, 'shown');
    showWeeklyToast(weeklyMessage.message);
  }

  if (notificationsEnabled && localStorage.getItem('lastWeeklyNotification') !== weeklyMessage.key) {
    sendWeeklyNotification(weeklyMessage).catch(() => showWeeklyToast(weeklyMessage.message));
  }
}

function buildCustomDateFromInput() {
  if (!customDateInput || !customDateInput.value) return null;

  const [year, month, day] = customDateInput.value.split('-').map(Number);
  const [hours, minutes] = (customTimeInput && customTimeInput.value ? customTimeInput.value : '00:00').split(':').map(Number);
  const targetDate = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);

  return Number.isNaN(targetDate.getTime()) ? null : targetDate;
}

function updateCustomCountdown() {
  const targetDate = buildCustomDateFromInput();
  const now = new Date();

  if (!targetDate) {
    customStatusTextElement.textContent = 'Elige una fecha válida para empezar la cuenta.';
    return;
  }

  const countdown = getCountdownParts(targetDate);
  customDaysElement.textContent = String(countdown.days).padStart(2, '0');
  customHoursElement.textContent = String(countdown.hours).padStart(2, '0');
  customMinutesElement.textContent = String(countdown.minutes).padStart(2, '0');
  customSecondsElement.textContent = String(countdown.seconds).padStart(2, '0');
  customTargetDateElement.textContent = `Próximo: ${formatDate(targetDate)}`;

  if (targetDate.getTime() <= now.getTime()) {
    customStatusTextElement.textContent = `La fecha elegida ya pasó. Selecciona otra mayor que ${formatDate(now)}.`;
    return;
  }

  customStatusTextElement.textContent = `Faltan ${countdown.days} días, ${countdown.hours} horas, ${countdown.minutes} minutos y ${countdown.seconds} segundos para ${formatDate(targetDate)}.`;
  const calendarKey = `${customCalendarDate.getFullYear()}-${customCalendarDate.getMonth()}-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${targetDate.getTime()}`;
  if (calendarKey !== customCalendarRenderKey) {
    renderCustomCalendar(now, targetDate);
    customCalendarRenderKey = calendarKey;
  }
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
  updateCustomCountdown();
}

switchToCustom?.addEventListener('click', () => {
  const savedDate = localStorage.getItem('customCountdownDate');
  if (savedDate) {
    customDateInput.value = savedDate;
    customTimeInput.value = localStorage.getItem('customCountdownTime') || '12:00';
  }
  updateCustomCountdown();
  showScreen('custom');
});

switchToMain?.addEventListener('click', () => {
  showScreen('main');
});

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
    customStatusTextElement.textContent = 'Elige una fecha válida antes de guardar.';
    return;
  }

  localStorage.setItem('customCountdownDate', customDateInput.value);
  localStorage.setItem('customCountdownTime', customTimeInput.value || '00:00');
  updateCustomCountdown();
});

customDateInput?.addEventListener('input', updateCustomCountdown);
customTimeInput?.addEventListener('input', updateCustomCountdown);

function saveNote(input, selectedDate, dateLabel, preview, rerender) {
  if (!selectedDate) {
    dateLabel.textContent = 'Selecciona un día del calendario';
    return;
  }

  const noteKey = `calendarNote-${getDateKey(selectedDate)}`;
  const note = input.value.trim();
  if (note) {
    localStorage.setItem(noteKey, note);
  } else {
    localStorage.removeItem(noteKey);
  }

  dateLabel.textContent = note
    ? `Nota guardada: ${formatNoteDate(selectedDate)}`
    : `Nota eliminada: ${formatNoteDate(selectedDate)}`;
  preview.textContent = note ? `Nota guardada: ${note}` : 'Este día todavía no tiene una nota.';
  preview.classList.toggle('has-note-content', Boolean(note));
  rerender();
}

previousMonthButton?.addEventListener('click', () => changeCalendarMonth('main', -1));
nextMonthButton?.addEventListener('click', () => changeCalendarMonth('main', 1));
previousCustomMonthButton?.addEventListener('click', () => changeCalendarMonth('custom', -1));
nextCustomMonthButton?.addEventListener('click', () => changeCalendarMonth('custom', 1));
saveMainNote?.addEventListener('click', () => saveNote(
  mainNoteInput,
  selectedMainNoteDate,
  mainNoteDate,
  mainNotePreview,
  () => {
    mainCalendarRenderKey = undefined;
    updateMainCountdown();
  },
));
saveCustomNote?.addEventListener('click', () => saveNote(
  customNoteInput,
  selectedCustomNoteDate,
  customNoteDate,
  customNotePreview,
  () => {
    customCalendarRenderKey = undefined;
    updateCustomCountdown();
  },
));

mainForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const selectedDate = buildMainDateFromInput();

  if (!selectedDate) {
    statusTextElement.textContent = 'Elige una fecha válida antes de aplicar el objetivo.';
    return;
  }

  localStorage.setItem('mainCountdownDate', mainDateInput.value);
  localStorage.setItem('mainCountdownTime', mainTimeInput.value || '12:00');
  mainCalendarRenderKey = undefined;
  updateMainCountdown();
});

themeSwatches.forEach((swatch) => {
  swatch.addEventListener('click', () => applyTheme(swatch.dataset.theme));
});

notificationButton?.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    showWeeklyToast('Tu navegador no permite avisos del sistema, pero verás el mensaje dentro de la app.');
    return;
  }

  const permission = await Notification.requestPermission();
  const weeklyMessage = getWeeklyMessage(new Date());

  if (permission === 'granted') {
    notificationButton.classList.add('enabled');
    notificationButton.textContent = 'Avisos activos';
    await sendWeeklyNotification(weeklyMessage);
    showWeeklyToast(weeklyMessage.message);
  } else {
    showWeeklyToast('Los avisos están desactivados. El mensaje semanal seguirá apareciendo dentro de la app.');
  }
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
applyTheme(localStorage.getItem('notebookTheme') || 'yellow');

if (savedMainDate) {
  mainDateInput.value = savedMainDate;
  mainTimeInput.value = localStorage.getItem('mainCountdownTime') || '12:00';
} else {
  setDefaultMainDate();
}

if (savedCustomDate) {
  customDateInput.value = savedCustomDate;
  customTimeInput.value = localStorage.getItem('customCountdownTime') || '12:00';
  updateCustomCountdown();
} else {
  setDefaultCustomDate();
}

setupBubbleReveal();
showScreen('main');

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
