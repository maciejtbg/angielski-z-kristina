/*
  Demo data layer — localStorage only, simulates the future real backend.
  Same shape this will have once wired to a real database (students,
  lessons, packages, credit balances, payments, settings). Swap
  load()/save() for real API calls later; the rest of dashboard.html /
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
    var db = { students: students, lessons: lessons, payments: payments, settings: settings };
    save(db);
    return db;
  }

  function migrate(db){
    if(!db.payments) db.payments = [];
    if(!db.settings) db.settings = { cancellationWindowHours: 2 };
    if(typeof db.settings.cancellationWindowHours !== 'number') db.settings.cancellationWindowHours = 2;
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

  return { load:load, save:save, reset:reset, uid:uid };
})();
