// ═══════════════════════════════════════════════════════════
// TRIGGERS UI — карточки триггеров + редактор
// ═══════════════════════════════════════════════════════════

var TriggersUI = (function() {
  var gridContainer = null;
  var editorOverlay = null;
  var editor = null;
  var currentTrigger = null;

  function init() {
    console.log('[TriggersUI] Инициализация...');
    gridContainer = document.getElementById('triggers-grid');

    if (!gridContainer) {
      console.error('[TriggersUI] Контейнер #triggers-grid не найден!');
      return;
    }

    console.log('[TriggersUI] Контейнер найден, создаём модальное окно...');
    createEditorModal();

    // Подписываемся на изменения
    if (window.TriggersStore) {
      TriggersStore.subscribe(render);
      console.log('[TriggersUI] Подписались на TriggersStore');
    } else {
      console.warn('[TriggersUI] TriggersStore не найден!');
    }
  }

  function createEditorModal() {
    editorOverlay = document.createElement('div');
    editorOverlay.className = 'trigger-editor-overlay';
    editorOverlay.addEventListener('click', closeEditor);

    editor = document.createElement('div');
    editor.className = 'trigger-editor';
    editor.addEventListener('click', function(e) { e.stopPropagation(); });

    editor.innerHTML = `
      <div class="trigger-editor__handle"></div>
      
      <div class="trigger-editor__header">
        <div class="trigger-editor__title" id="trigger-editor-title">Настройка триггера</div>
        <button class="trigger-editor__close" id="trigger-editor-close">×</button>
      </div>

      <div class="trigger-editor__content">
        <form id="trigger-editor-form">
          
          <div class="trigger-editor__field">
            <label class="trigger-editor__label">Тип бонуса</label>
            <select class="trigger-editor__select" id="trigger-bonus-type">
              <option value="none">Нет бонуса</option>
              <option value="discount_percent">Скидка (%)</option>
              <option value="discount_fixed">Скидка (₽)</option>
              <option value="points">Баллы</option>
            </select>
          </div>

          <div class="trigger-editor__field" id="trigger-bonus-value-field">
            <label class="trigger-editor__label">Значение бонуса</label>
            <input type="number" class="trigger-editor__input" id="trigger-bonus-value" placeholder="10" />
          </div>

          <div class="trigger-editor__field">
            <label class="trigger-editor__label">Текст сообщения</label>
            <textarea class="trigger-editor__textarea" id="trigger-message" placeholder="Введите текст сообщения клиенту..."></textarea>
          </div>

        </form>
      </div>

      <div class="trigger-editor__footer">
        <button class="trigger-editor__btn trigger-editor__btn--cancel" id="trigger-editor-cancel" type="button">Отмена</button>
        <button class="trigger-editor__btn trigger-editor__btn--save" id="trigger-editor-save" type="button">Сохранить</button>
      </div>
    `;

    document.body.appendChild(editorOverlay);
    document.body.appendChild(editor);

    console.log('[TriggersUI] Модальное окно создано, прикрепляю обработчики...');
    attachEditorListeners();
  }

  function attachEditorListeners() {
    var closeBtn = document.getElementById('trigger-editor-close');
    var cancelBtn = document.getElementById('trigger-editor-cancel');
    var saveBtn = document.getElementById('trigger-editor-save');
    var bonusTypeSelect = document.getElementById('trigger-bonus-type');

    console.log('[TriggersUI] Поиск кнопок:');
    console.log('  - closeBtn:', !!closeBtn);
    console.log('  - cancelBtn:', !!cancelBtn);
    console.log('  - saveBtn:', !!saveBtn);
    console.log('  - bonusTypeSelect:', !!bonusTypeSelect);

    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        console.log('[TriggersUI] Клик по close');
        closeEditor();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function(e) {
        console.log('[TriggersUI] Клик по cancel');
        closeEditor();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function(e) {
        console.log('[TriggersUI] ✅ КЛИК ПО СОХРАНИТЬ!');
        e.preventDefault();
        e.stopPropagation();
        saveTrigger();
      });
      console.log('[TriggersUI] ✅ Обработчик сохранения прикреплён');
    } else {
      console.error('[TriggersUI] ❌ Кнопка сохранения не найдена!');
    }

    // Показываем/скрываем поле значения в зависимости от типа
    if (bonusTypeSelect) {
      bonusTypeSelect.addEventListener('change', function() {
        var valueField = document.getElementById('trigger-bonus-value-field');
        if (this.value === 'none') {
          valueField.style.display = 'none';
        } else {
          valueField.style.display = 'block';
        }
      });
    }
  }

  function render(triggers) {
    if (!gridContainer) return;

    if (!triggers || triggers.length === 0) {
      gridContainer.innerHTML = '<p class="placeholder-text">Загружаем...</p>';
      return;
    }

    gridContainer.innerHTML = triggers.map(function(trigger) {
      var enabledClass = trigger.is_enabled ? 'enabled' : '';
      var toggleClass = trigger.is_enabled ? 'on' : '';

      return (
        '<div class="trigger-card ' + enabledClass + '" data-trigger-key="' + trigger.key + '">' +
          '<div class="trigger-card__icon">' + trigger.icon + '</div>' +
          '<div class="trigger-card__content">' +
            '<div class="trigger-card__title">' + trigger.title + '</div>' +
            '<div class="trigger-card__desc">' + trigger.description + '</div>' +
          '</div>' +
          '<div class="trigger-card__toggle ' + toggleClass + '" data-trigger-key="' + trigger.key + '"></div>' +
        '</div>'
      );
    }).join('');

    // Обработчики
    gridContainer.querySelectorAll('.trigger-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        // Если клик по тумблеру — не открываем редактор
        if (e.target.classList.contains('trigger-card__toggle')) return;
        
        var key = this.dataset.triggerKey;
        console.log('[TriggersUI] Открываем редактор для:', key);
        openEditor(key);
      });
    });

    gridContainer.querySelectorAll('.trigger-card__toggle').forEach(function(toggle) {
      toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        var key = this.dataset.triggerKey;
        console.log('[TriggersUI] Переключаем триггер:', key);
        toggleTrigger(key);
      });
    });
  }

  function toggleTrigger(key) {
    if (!window.TriggersStore) {
      console.error('[TriggersUI] TriggersStore не найден');
      return;
    }

    var trigger = TriggersStore.getByKey(key);
    if (!trigger) {
      console.error('[TriggersUI] Триггер не найден:', key);
      return;
    }

    var newState = !trigger.is_enabled;
    console.log('[TriggersUI] Переключаю', key, 'на', newState);

    TriggersStore.update(key, { is_enabled: newState })
      .then(function() {
        console.log('[TriggersUI] ✅ Триггер обновлён');
      })
      .catch(function(error) {
        console.error('[TriggersUI] Ошибка переключения:', error);
        alert('Ошибка сохранения');
      });
  }

  function openEditor(key) {
    if (!window.TriggersStore) {
      console.error('[TriggersUI] TriggersStore не найден');
      return;
    }

    var trigger = TriggersStore.getByKey(key);
    if (!trigger) {
      console.error('[TriggersUI] Триггер не найден:', key);
      return;
    }

    currentTrigger = trigger;
    console.log('[TriggersUI] Открыт редактор для:', trigger.key);

    document.getElementById('trigger-editor-title').textContent = trigger.title;
    document.getElementById('trigger-bonus-type').value = trigger.bonus_type || 'none';
    document.getElementById('trigger-bonus-value').value = trigger.bonus_value || '';
    document.getElementById('trigger-message').value = trigger.message_text || '';

    // Показываем/скрываем поле значения
    var valueField = document.getElementById('trigger-bonus-value-field');
    if (trigger.bonus_type === 'none') {
      valueField.style.display = 'none';
    } else {
      valueField.style.display = 'block';
    }

    // Блокируем скролл
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    editorOverlay.classList.add('active');
    setTimeout(function() {
      editor.classList.add('active');
    }, 10);
  }

  function closeEditor() {
    console.log('[TriggersUI] Закрываем редактор');
    editor.classList.remove('active');
    setTimeout(function() {
      editorOverlay.classList.remove('active');
      currentTrigger = null;

      // Восстанавливаем скролл
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }, 300);
  }

  function saveTrigger() {
    console.log('[TriggersUI] 🔴 СОХРАНЕНИЕ ТРИГГЕРА!');
    console.log('[TriggersUI] currentTrigger:', currentTrigger);
    console.log('[TriggersUI] TriggersStore:', !!window.TriggersStore);

    if (!currentTrigger) {
      console.error('[TriggersUI] currentTrigger не установлен!');
      alert('Ошибка: триггер не выбран');
      return;
    }

    if (!window.TriggersStore) {
      console.error('[TriggersUI] TriggersStore не найден!');
      alert('Ошибка: TriggersStore недоступен');
      return;
    }

    var bonusType = document.getElementById('trigger-bonus-type').value;
    var bonusValue = parseFloat(document.getElementById('trigger-bonus-value').value) || 0;
    var message = document.getElementById('trigger-message').value;

    console.log('[TriggersUI] Данные для сохранения:', {
      key: currentTrigger.key,
      bonusType: bonusType,
      bonusValue: bonusValue,
      messageLength: message.length
    });

    if (!message.trim()) {
      alert('Введите текст сообщения');
      return;
    }

    var saveBtn = document.getElementById('trigger-editor-save');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Сохранение...';
    }

    TriggersStore.update(currentTrigger.key, {
      bonus_type: bonusType,
      bonus_value: bonusValue,
      message_text: message
    })
      .then(function() {
        console.log('[TriggersUI] ✅ Триггер успешно сохранён!');
        closeEditor();
      })
      .catch(function(error) {
        console.error('[TriggersUI] ❌ Ошибка сохранения:', error);
        alert('Ошибка сохранения: ' + (error.message || error.code || 'Неизвестная ошибка'));
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Сохранить';
        }
      });
  }

  return {
    init: init
  };
})();

window.TriggersUI = TriggersUI;
