var CalendarScheduler = (function() {
  var container = null;
  var currentDate = null;
  var currentView = 'day';
  var currentWorkouts = [];
  var draggedEvent = null;
  var resizedEvent = null;

  function init(containerId, initialDate) {
    container = document.getElementById(containerId);
    if (!container) return;

    currentDate = new Date(initialDate || new Date());
    render();
  }

  function render() {
    if (!container) return;

    var html = '';
    html += '<div class="calendar-top-bar">';
    html += '  <div class="calendar-date-display" id="calendar-date-label"></div>';
    html += '  <div class="calendar-view-toggle">';
    html += '    <button class="active" data-view="day">День</button>';
    html += '    <button data-view="week">Неделя</button>';
    html += '    <button data-view="month">Месяц</button>';
    html += '  </div>';
    html += '</div>';

    if (currentView === 'day') {
      html += renderDayView();
    } else if (currentView === 'week') {
      html += renderWeekView();
    } else if (currentView === 'month') {
      html += renderMonthView();
    }

    container.innerHTML = html;
    updateDateLabel();
    attachEventListeners();
  }

  function renderDayView() {
    var html = '<div class="calendar-day">';
    html += '<div class="calendar-day-grid">';
    html += renderRuler();
    html += renderGridContainer();
    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderRuler() {
    var html = '<div class="calendar-ruler">';
    for (var h = 0; h < 24; h++) {
      var time = String(h).padStart(2, '0') + ':00';
      html += '<div class="calendar-ruler-line hour">' + time + '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderGridContainer() {
    var html = '<div class="calendar-grid-container">';
    html += '<div class="calendar-grid" id="calendar-grid">';

    // Сетка часов
    for (var h = 0; h < 24; h++) {
      html += '<div class="calendar-grid-line hour" style="top: ' + (h * 60) + 'px;"></div>';
      for (var m = 15; m < 60; m += 15) {
        html += '<div class="calendar-grid-line" style="top: ' + (h * 60 + m) + 'px;"></div>';
      }
    }

    // События
    var dateStr = dateToISO(currentDate);
    var workoutsForDay = currentWorkouts.filter(function(w) {
      return w.workout_date === dateStr;
    });

    workoutsForDay.forEach(function(w, i) {
      html += renderEvent(w, i);
    });

    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderEvent(w, colorIndex) {
    var colors = ['blue', 'pink', 'green', 'purple'];
    var color = colors[colorIndex % colors.length];

    var startTime = w.start_time || '00:00';
    var parts = startTime.split(':');
    var hours = parseInt(parts[0], 10);
    var minutes = parseInt(parts[1], 10);
    var topPx = hours * 60 + minutes;

    var duration = w.duration || 60;
    var heightPx = duration;

    var isDone = w.status === 'done';

    var html = '';
    html += '<div class="calendar-event ' + color + (isDone ? ' done' : '') + '" ';
    html += 'data-id="' + w.id + '" ';
    html += 'style="top: ' + topPx + 'px; height: ' + heightPx + 'px;">';
    html += '<div class="calendar-event__title">' + (w.title || 'Тренировка') + '</div>';
    html += '<div class="calendar-event__time">' + startTime + ' (' + duration + ' мин)</div>';
    html += '<div class="calendar-event__client">' + (w.client_name || 'Клиент') + '</div>';
    html += '<div class="calendar-event__resize-handle"></div>';
    html += '</div>';

    return html;
  }

  function renderWeekView() {
    // Неделя (позже)
    return '<div class="calendar-week"><p style="padding: 16px;">Неделя — разработка</p></div>';
  }

  function renderMonthView() {
    // Месяц (позже)
    return '<div class="calendar-month"><p style="padding: 16px;">Месяц — разработка</p></div>';
  }

  function updateDateLabel() {
    var dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    var monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                     'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

    var day = currentDate.getDate();
    var month = monthNames[currentDate.getMonth()];
    var dayName = dayNames[currentDate.getDay()];

    var label = dayName + ', ' + day + ' ' + month;
    var labelEl = document.getElementById('calendar-date-label');
    if (labelEl) labelEl.textContent = label;
  }

  function attachEventListeners() {
    // Переключение вида 
    var viewBtns = container.querySelectorAll('.calendar-view-toggle button');
    viewBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentView = this.dataset.view;
        viewBtns.forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        render();
      });
    });

    // Drag & Drop события
    if (currentView === 'day') {
      var events = container.querySelectorAll('.calendar-event');
      events.forEach(function(eventEl) {
        eventEl.addEventListener('mousedown', onEventMouseDown);
        eventEl.addEventListener('touchstart', onEventTouchStart);
      });
    }
  }

  function onEventMouseDown(e) {
    if (e.target.closest('.calendar-event__resize-handle')) {
      startResize(this, e);
    } else {
      startDrag(this, e);
    }
  }

  function onEventTouchStart(e) {
    if (e.target.closest('.calendar-event__resize-handle')) {
      startResize(this, e);
    } else {
      startDrag(this, e);
    }
  }

  function startDrag(eventEl, e) {
    draggedEvent = {
      el: eventEl,
      id: eventEl.dataset.id,
      startY: e.type.indexOf('touch') >= 0 ? e.touches[0].clientY : e.clientY,
      startTop: parseInt(eventEl.style.top, 10),
      startTime: eventEl.style.top
    };

    eventEl.classList.add('dragging');

    var onMove = e.type.indexOf('touch') >= 0 ? onTouchMove : onMouseMove;
    var onEnd = e.type.indexOf('touch') >= 0 ? onTouchEnd : onMouseUp;

    if (e.type.indexOf('touch') >= 0) {
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    } else {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!draggedEvent) return;
    updateDragPosition(e.clientY);
  }

  function onTouchMove(e) {
    if (!draggedEvent) return;
    updateDragPosition(e.touches[0].clientY);
  }

  function updateDragPosition(clientY) {
    var delta = clientY - draggedEvent.startY;
    var newTop = draggedEvent.startTop + delta;

    // Ограничение: 0 - 1440 (24 часа)
    if (newTop < 0) newTop = 0;
    if (newTop > 1380) newTop = 1380; // 1440 - минимальная высота

    draggedEvent.el.style.top = newTop + 'px';
  }

  function onMouseUp(e) {
    finishDrag();
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  function onTouchEnd(e) {
    finishDrag();
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
  }

  function finishDrag() {
    if (!draggedEvent) return;

    var newTopPx = parseInt(draggedEvent.el.style.top, 10);
    var newHours = Math.floor(newTopPx / 60);
    var newMinutes = (newTopPx % 60);

    // Округляем к ближайшим 15 минутам
    newMinutes = Math.round(newMinutes / 15) * 15;
    if (newMinutes === 60) {
      newHours++;
      newMinutes = 0;
    }

    var newTime = String(newHours).padStart(2, '0') + ':' + String(newMinutes).padStart(2, '0') + ':00';

    draggedEvent.el.classList.remove('dragging');
    draggedEvent.el.style.top = (newHours * 60 + newMinutes) + 'px';

    // Отправляем UPDATE в Supabase
    var workoutId = draggedEvent.id;
    if (workoutId && sb) {
      sb.from('workouts')
        .update({
          start_time: newTime,
          updated_at_supabase: new Date().toISOString()
        })
        .eq('id', workoutId)
        .then(function(res) {
          if (!res.error) {
            // Успешно обновлено
          }
        });
    }

    draggedEvent = null;
  }

  function startResize(eventEl, e) {
    resizedEvent = {
      el: eventEl,
      id: eventEl.dataset.id,
      startY: e.type.indexOf('touch') >= 0 ? e.touches[0].clientY : e.clientY,
      startHeight: parseInt(eventEl.style.height, 10)
    };

    eventEl.classList.add('resizing');

    var onMove = e.type.indexOf('touch') >= 0 ? onTouchMoveResize : onMouseMoveResize;
    var onEnd = e.type.indexOf('touch') >= 0 ? onTouchEndResize : onMouseUpResize;

    if (e.type.indexOf('touch') >= 0) {
      document.addEventListener('touchmove', onTouchMoveResize, { passive: false });
      document.addEventListener('touchend', onTouchEndResize);
    } else {
      document.addEventListener('mousemove', onMouseMoveResize);
      document.addEventListener('mouseup', onMouseUpResize);
    }

    e.preventDefault();
  }

  function onMouseMoveResize(e) {
    if (!resizedEvent) return;
    updateResizeHeight(e.clientY);
  }

  function onTouchMoveResize(e) {
    if (!resizedEvent) return;
    updateResizeHeight(e.touches[0].clientY);
  }

  function updateResizeHeight(clientY) {
    var delta = clientY - resizedEvent.startY;
    var newHeight = resizedEvent.startHeight + delta;

    // Минимум 15 минут (15px)
    if (newHeight < 15) newHeight = 15;

    resizedEvent.el.style.height = newHeight + 'px';
  }

  function onMouseUpResize(e) {
    finishResize();
    document.removeEventListener('mousemove', onMouseMoveResize);
    document.removeEventListener('mouseup', onMouseUpResize);
  }

  function onTouchEndResize(e) {
    finishResize();
    document.removeEventListener('touchmove', onTouchMoveResize);
    document.removeEventListener('touchend', onTouchEndResize);
  }

  function finishResize() {
    if (!resizedEvent) return;

    var newHeightPx = parseInt(resizedEvent.el.style.height, 10);
    var newDuration = Math.max(15, Math.round(newHeightPx / 15) * 15);

    resizedEvent.el.classList.remove('resizing');
    resizedEvent.el.style.height = newDuration + 'px';

    // Отправляем UPDATE в Supabase
    var workoutId = resizedEvent.id;
    if (workoutId && sb) {
      sb.from('workouts')
        .update({
          duration: newDuration,
          updated_at_supabase: new Date().toISOString()
        })
        .eq('id', workoutId)
        .then(function(res) {
          if (!res.error) {
            // Успешно обновлено
          }
        });
    }

    resizedEvent = null;
  }

  function updateWorkouts(workouts) {
    currentWorkouts = workouts || [];
    if (container) render();
  }

  function setDate(date) {
    currentDate = new Date(date);
    if (container) render();
  }

  function dateToISO(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  return {
    init: init,
    updateWorkouts: updateWorkouts,
    setDate: setDate,
    render: render
  };
})();

window.CalendarScheduler = CalendarScheduler;
