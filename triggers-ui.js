// ═══════════════════════════════════════════════════════════
// TRIGGERS UI — карточки триггеров + редактор
// ═══════════════════════════════════════════════════════════

var TriggersUI = (function() {
  var gridContainer = null;
  var editorOverlay = null;
  var editor = null;
  var currentTrigger = null;

  function init() {
    gridContainer = document.getElementById('triggers-grid');

    if (!gridContainer) return;

    createEditorModal();

    // Подписываемся на изменения
    if (window.TriggersStore) {
      TriggersStore.subscribe(render);
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
        <button class="trigger-editor__btn trigger-editor__btn--cancel" id="trigger-editor-cancel">Отмена</button>
        <button class="trigger-editor__btn trigger-editor__btn--save" id="trigger-editor-save">Сохранить</button>
      </div>
    `;

    document.body.appendChild(editorOverlay);
    document.body.appendChild(editor);

    attachEditorListeners();
  }

  function attachEditorListeners() {
    document.getElementById('trigger-editor-close').addEventListener('click', closeEditor);
    document.getElementById('trigger-editor-cancel').addEventListener('click', closeEditor);
    document.getElementById('trigger-editor-save').addEventListener('click', saveTrigger);

    // Показываем/скрываем поле значения в зависимости от типа
    document.getElementById('trigger-bonus-type').addEventListener('change', function() {
      var valueField = document.getElementById('trigger-bonus-value-field');
      if (this.value === 'none') {
        valueField.style.display = 'none';
      } else {
        valueField.style.display = 'block';
      }
    });
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
        openEditor(key);
      });
    });

    gridContainer.querySelectorAll('.trigger-card__toggle').forEach(function(toggle) {
      toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        var key = this.dataset.triggerKey;
        toggleTrigger(key);
      });
    });
  }

  function toggleTrigger(key) {
    if (!window.TriggersStore) return;

    var trigger = TriggersStore.getByKey(key);
    if (!trigger) return;

    var newState = !trigger.is_enabled;

    TriggersStore.update(key, { is_enabled: newState })
      .catch(function(error) {
        console.error('[TriggersUI] Ошибка переключения:', error);
        alert('Ошибка сохранения');
      });
  }

  function openEditor(key) {
    if (!window.TriggersStore) return;

    var trigger = TriggersStore.getByKey(key);
    if (!trigger) return;

    currentTrigger = trigger;

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
    if (!currentTrigger || !window.TriggersStore) return;

    var bonusType = document.getElementById('trigger-bonus-type').value;
    var bonusValue = parseFloat(document.getElementById('trigger-bonus-value').value) || 0;
    var message = document.getElementById('trigger-message').value;

    if (!message.trim()) {
      alert('Введите текст сообщения');
      return;
    }

    var saveBtn = document.getElementById('trigger-editor-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Сохранение...';

    TriggersStore.update(currentTrigger.key, {
      bonus_type: bonusType,
      bonus_value: bonusValue,
      message_text: message
    })
      .then(function() {
        closeEditor();
      })
      .catch(function(error) {
        console.error('[TriggersUI] Ошибка сохранения:', error);
        alert('Ошибка сохранения: ' + (error.message || 'Неизвестная ошибка'));
        saveBtn.disabled = false;
        saveBtn.textContent = 'Сохранить';
      });
  }

  return {
    init: init
  };
})();

window.TriggersUI = TriggersUI;
