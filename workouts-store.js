var WorkoutsStore = (function() {
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

  function dateTime(w) {
    return new Date(w.workout_date + 'T' + (w.start_time || '00:00:00')).getTime();
  }

  function loadAll() {
    if (!trainerId || !sb) return Promise.resolve([]);

    var sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    var fromDate     = sevenDaysAgo.toISOString().split('T')[0];

    return sb.from('workouts')
      .select('*')
      .eq('trainer_tg_id', trainerId)
      .neq('deleted', true)
      .gte('workout_date', fromDate)
      .order('workout_date', { ascending: true })
      .order('start_time',   { ascending: true })
      .then(function(result) {
        if (result.error) return items;
        items = (result.data || []).filter(function(w) {
          return w.status !== 'cancelled';
        });
        notify();
        return items;
      });
  }

  function upcoming(limit) {
    var now  = Date.now() - 60 * 60 * 1000;
    var list = items
      .filter(function(w) { return dateTime(w) >= now; })
      .sort(function(a, b) { return dateTime(a) - dateTime(b); });
    return limit ? list.slice(0, limit) : list;
  }

  function forDate(dateStr) {
    return items
      .filter(function(w) { return w.workout_date === dateStr; })
      .sort(function(a, b) { return dateTime(a) - dateTime(b); });
  }

  function createWorkout(data) {
    if (!sb) return Promise.reject('No Supabase client');

    var workoutData = {
      trainer_tg_id: data.trainer_tg_id || trainerId,
      client_id: data.client_id || null,
      client_name: data.client_name || 'Клиент',
      type: data.type || 'personal',
      workout_date: data.workout_date,
      start_time: data.start_time,
      duration: data.duration || 60,
      cost: data.cost || null,
      status: data.status || 'planned',
      deleted: false,
      title: data.client_name || 'Тренировка',
      updated_at_supabase: new Date().toISOString()
    };

    return sb.from('workouts')
      .insert(workoutData)
      .select()
      .single()
      .then(function(result) {
        if (result.error) {
          console.error('[WorkoutsStore] Ошибка создания:', result.error);
          return Promise.reject(result.error);
        }

        var newWorkout = result.data;
        items.push(newWorkout);
        notify();

        return newWorkout;
      });
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

      setInterval(function() {
        if (document.visibilityState === 'visible') loadAll();
      }, 60000);

      return items;
    });
  }

  return {
    init:          init,
    subscribe:     subscribe,
    upcoming:      upcoming,
    forDate:       forDate,
    createWorkout: createWorkout,
    refresh:       loadAll
  };
})();

window.WorkoutsStore = WorkoutsStore;
