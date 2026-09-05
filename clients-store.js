// ═══════════════════════════════════════════════════════════
// CLIENTS STORE — загрузка клиентов из Supabase + realtime
// ═══════════════════════════════════════════════════════════
// По образцу workouts-store.js

var ClientsStore = (function() {
  var items     = [];
  var trainerId = null;
  var channel   = null;
  var listeners = [];

  function notify() {
    listeners.forEach(function(fn) {
      try { fn(items); } catch(e) {}
    });
  }

  function subscribe(fn) {
    listeners.push(fn);
    if (items.length) fn(items);
    return function() {
      var idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  function loadAll() {
    if (!trainerId || !sb) return Promise.resolve([]);

    return sb.from('clients')
      .select('*')
      .eq('trainer_tg_id', trainerId)
      .neq('deleted', true)
      .order('name', { ascending: true })
      .then(function(result) {
        if (result.error) {
          console.error('[ClientsStore] Ошибка загрузки:', result.error);
          return items;
        }
        items = result.data || [];
        notify();
        return items;
      });
  }

  function getAll() {
    return items.slice();
  }

  function getById(id) {
    return items.find(function(c) { return c.id === id; });
  }

  function getActive() {
    return items.filter(function(c) {
      return c.status === 'active';
    });
  }

  function getPending() {
    return items.filter(function(c) {
      return c.status === 'pending';
    });
  }

  function getRecent(limit) {
    var recent = items.slice().sort(function(a, b) {
      var dateA = new Date(a.updated_at || a.created_at);
      var dateB = new Date(b.updated_at || b.created_at);
      return dateB - dateA;
    });
    return limit ? recent.slice(0, limit) : recent;
  }

  function create(data) {
    if (!trainerId || !sb) return Promise.reject('No trainer ID');

    var clientData = {
      trainer_tg_id: trainerId,
      name: data.name || 'Новый клиент',
      phone: data.phone || null,
      status: 'pending',
      default_type: data.default_type || 'personal',
      default_duration: data.default_duration || 60,
      default_cost: data.default_cost || null,
      deleted: false
    };

    return sb.from('clients')
      .insert(clientData)
      .select()
      .single()
      .then(function(result) {
        if (result.error) {
          console.error('[ClientsStore] Ошибка создания:', result.error);
          return Promise.reject(result.error);
        }
        items.push(result.data);
        notify();
        return result.data;
      });
  }

  function update(id, data) {
    if (!sb) return Promise.reject('No Supabase client');

    return sb.from('clients')
      .update(Object.assign({}, data, { updated_at: new Date().toISOString() }))
      .eq('id', id)
      .select()
      .single()
      .then(function(result) {
        if (result.error) {
          console.error('[ClientsStore] Ошибка обновления:', result.error);
          return Promise.reject(result.error);
        }

        var idx = items.findIndex(function(c) { return c.id === id; });
        if (idx >= 0) items[idx] = result.data;
        notify();
        return result.data;
      });
  }

  function startRealtime() {
    if (!sb || channel || !trainerId) return;

    channel = sb.channel('clients-' + trainerId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'clients',
        filter: 'trainer_tg_id=eq.' + trainerId
      }, function() {
        loadAll();
      })
      .subscribe();
  }

  function init(tgId) {
    trainerId = tgId;
    return loadAll().then(function() {
      startRealtime();

      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') loadAll();
      });

      return items;
    });
  }

  return {
    init:       init,
    subscribe:  subscribe,
    getAll:     getAll,
    getById:    getById,
    getActive:  getActive,
    getPending: getPending,
    getRecent:  getRecent,
    create:     create,
    update:     update,
    refresh:    loadAll
  };
})();

window.ClientsStore = ClientsStore;
