// workouts-store.js
// Единое хранилище тренировок с автосинхронизацией
var WorkoutsStore = (function() {
  var items = [];
  var trainerId = null;
  var channel = null;
  var listeners = [];
  
  function notify() {
    listeners.forEach(function(fn) {
      try { fn(items); } catch(e) { console.error('[store] listener error', e); }
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
  
  function dateTime(w) {
    return new Date(w.workout_date + 'T' + w.start_time).getTime();
  }
  
  function loadAll() {
    if (!trainerId || !sb) return Promise.resolve([]);
    
    var sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    var fromDate = sevenDaysAgo.toISOString().split('T')[0];
    
    return sb.from('workouts')
      .select('*')
      .eq('trainer_tg_id', trainerId)
      .gte('workout_date', fromDate)
      .is('deleted_at', null)  // Только живые тренировки (без soft delete)
      .order('workout_date', { ascending: true })
      .order('start_time', { ascending: true })
      .then(function(result) {
        if (result.error) {
          console.error('[store] load error:', result.error);
          return items;
        }
        items = (result.data || []).filter(function(w) {
          // Дополнительная фильтрация: исключаем отмеченные на удаление
          return w.status !== 'cancelled' && !w.deleted_at;
        });
        notify();
        return items;
      });
  }
  
  function upcoming(limit) {
    var now = Date.now() - 60 * 60 * 1000;
    var list = items.filter(function(w) { return dateTime(w) >= now; })
      .sort(function(a, b) { return dateTime(a) - dateTime(b); });
    return limit ? list.slice(0, limit) : list;
  }
  
  function forDate(dateStr) {
    return items.filter(function(w) { return w.workout_date === dateStr; })
      .sort(function(a, b) { return dateTime(a) - dateTime(b); });
  }
  
  function startRealtime() {
    if (!sb || channel || !trainerId) return;
    
    channel = sb.channel('workouts-' + trainerId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workouts',
        filter: 'trainer_tg_id=eq.' + trainerId
      }, function() {
        console.log('[store] realtime update detected');
        loadAll();
      })
      .subscribe();
  }
  
  function init(tgId) {
    trainerId = tgId;
    if (!sb) return;
    
    loadAll().then(function() {
      startRealtime();
    });
  }
  
  return {
    init: init,
    subscribe: subscribe,
    loadAll: loadAll,
    forDate: forDate,
    upcoming: upcoming,
  };
})();
