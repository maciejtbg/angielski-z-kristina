/*
  Demo data layer — localStorage only, simulates the future real backend.
  Same shape this will have once wired to a real database (students,
  lessons, packages, credit balances, payments, settings, activityLog).
  Swap load()/save() for real API calls later; the rest of dashboard.html /
  rodzic.html doesn't need to change.
*/
window.AKKDemo = (function(){
  var KEY = 'akk_demo_db_v2';

  function uid(){ return Math.random().toString(36).slice(2,10); }

  function seed(){
    var today = new Date(); today.setHours(0,0,0,0);
    function at(daysFromNow, hour){ var d=new Date(today); d.setDate(d.getDate()+daysFromNow); d.setHours(hour,0,0,0); return d.toISOString(); }
    var students = [
      { id:'demo-zofia', name:'Zofia (demo)', parentName:'Anna Kowalska', contact:'+48 600 111 222',
        pricePerLesson:30, creditBalance:3,
        packages:[
          {id:uid(), label:'', lessons:4, price:116},
          {id:uid(), label:'', lessons:8, price:224}
        ]
      },
      { id:'demo-kuba', name:'Kuba (demo)', parentName:'Marek Nowak', contact:'+48 600 333 444',
        pricePerLesson:26, creditBalance:1,
        packages:[
          {id:uid(), label:'', lessons:12, price:312}
        ]
      },
      { id:'demo-julia', name:'Julia (demo)', parentName:'Ola Wiśniewska', contact:'+48 600 555 666',
        pricePerLesson:30, creditBalance:0,
        packages:[
          {id:uid(), label:'', lessons:4, price:116}
        ]
      }
    ];
    var lessons = [
      { id:uid(), studentId:'demo-zofia', datetime: at(1,17), type:'weekly', seriesId:'s1', status:'booked' },
      { id:uid(), studentId:'demo-zofia', datetime: at(8,17), type:'weekly', seriesId:'s1', status:'booked' },
      { id:uid(), studentId:'demo-kuba', datetime: at(2,18), type:'oneoff', status:'booked' },
      { id:uid(), studentId:'demo-julia', datetime: at(0,19), type:'trial', status:'booked' },
      { id:uid(), studentId:'demo-kuba', datetime: at(-3,18), type:'weekly', seriesId:'s2', status:'completed' }
    ];
    var payments = [
      { id:uid(), studentId:'demo-zofia', datetime: at(-10,9), lessons:4, price:116 },
      { id:uid(), studentId:'demo-kuba', datetime: at(-20,9), lessons:12, price:312 }
    ];
    var settings = { cancellationWindowHours: 2 };
    var db = { students: students, lessons: lessons, payments: payments, settings: settings, activityLog: [] };
    save(db);
    return db;
  }

  function migrate(db){
    if(!db.payments) db.payments = [];
    if(!db.settings) db.settings = { cancellationWindowHours: 2 };
    if(typeof db.settings.cancellationWindowHours !== 'number') db.settings.cancellationWindowHours = 2;
    if(!db.activityLog) db.activityLog = [];
    return db;
  }

  function load(){
    try{
      var raw = localStorage.getItem(KEY);
      if(raw) return migrate(JSON.parse(raw));
    }catch(e){}
    return seed();
  }
  function save(db){ try{ localStorage.setItem(KEY, JSON.stringify(db)); }catch(e){} }
  function reset(){ try{ localStorage.removeItem(KEY); }catch(e){} return seed(); }

  var LOG_LIMIT = 200;

  function snapshotState(db){
    return JSON.parse(JSON.stringify({
      students: db.students || [],
      lessons: db.lessons || [],
      payments: db.payments || [],
      settings: db.settings || { cancellationWindowHours: 2 }
    }));
  }

  // Runs mutateFn(), then records an undoable log entry capturing the
  // state exactly as it was right before mutateFn ran. Does NOT call
  // save() — callers still call AKKDemo.save(db) themselves afterwards.
  function withLog(db, description, mutateFn){
    var before = snapshotState(db);
    mutateFn();
    if(!db.activityLog) db.activityLog = [];
    db.activityLog.unshift({
      id: uid(),
      timestamp: new Date().toISOString(),
      description: description,
      snapshot: before,
      undone: false,
      isUndoMarker: false
    });
    if(db.activityLog.length > LOG_LIMIT) db.activityLog.length = LOG_LIMIT;
  }

  // Undoes the single most recent undoable entry (top of the log that is
  // not itself an undo-marker and not already undone). Returns the
  // description of what was undone, or null if there was nothing to undo
  // or the entry was malformed (defensive — never throws).
  function undoTop(db){
    if(!db || !Array.isArray(db.activityLog) || db.activityLog.length === 0) return null;
    var entry = db.activityLog[0];
    if(!entry || entry.isUndoMarker || entry.undone) return null;
    var snap = entry.snapshot;
    if(!snap || typeof snap !== 'object') return null;
    db.students = Array.isArray(snap.students) ? snap.students : [];
    db.lessons = Array.isArray(snap.lessons) ? snap.lessons : [];
    db.payments = Array.isArray(snap.payments) ? snap.payments : [];
    db.settings = (snap.settings && typeof snap.settings === 'object') ? snap.settings : { cancellationWindowHours: 2 };
    entry.undone = true;
    db.activityLog.unshift({
      id: uid(),
      timestamp: new Date().toISOString(),
      description: '↩ ' + entry.description,
      snapshot: null,
      undone: false,
      isUndoMarker: true
    });
    if(db.activityLog.length > LOG_LIMIT) db.activityLog.length = LOG_LIMIT;
    return entry.description;
  }

  return { load:load, save:save, reset:reset, uid:uid, withLog:withLog, undoTop:undoTop };
})();
