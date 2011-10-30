/*

parameters: an arbitrary number of arguments, each of which is a valid function name.

an object with the listen events install is returned.

Example:

var obj = new Object();

// install three events emitters on object
eventify(obj).define('onClick', 'onUpdate', 'onHide');

// register some listeners..
obj.onClick(event_handler_function);
obj.onUpdate(event_handler_function);
obj.onHide(event_handler_function);

// emit the events..
obj.onClick.emit();
obj.onHide.emit();

obj.onUpdate().emit(new_value_arg);
// n.b.: new_value_arg MUST NOT be a function otherwise it will be treated as an event handler

// unbind the events...
obj.onClick().unbind(event_handler_function)
obj.onUpdate().unbind(event_handler_function)
obj.onHide().unbind(event_handler_function)
(obj.<eventName>().unbind(<handler>))

can also register a delegate:

var delegate = {
  onSomeEvent: function (arg0) {
    console.info(arg0)
  }
}

obj.onSomeEvent(delegate);

obj.onSomeEvent().emit("MEOW");
=> "MEOW"

*/

function eventify(source) {

   // register a new event for the source
   function installEvent (obj, eventName) {
      var listeners = [];
      var self = null;

      var eventManager = {
        unbind: function (listenerToRemove) {
          listeners = listeners.filter(function(registeredListener){
            return registeredListener != listenerToRemove;
          });
          return self;
        },
        unbindAll: function (listenerToRemove) {
          listeners = [];
          return self;
        },
        emit: function () {

          var time_now = (new Date).getTime();
          var lastEmitTime = parseInt(eventManager.lastEmitTime) || 0;
          var minimumEmitInterval = parseInt(eventManager.minimumEmitInterval) || 0;
          eventManager.eventArguments = arguments;
          var runListeners = function () {
            eventManager.lastEmitTime = time_now;
            listeners.forEach(function(listener){
              if (typeof listener === 'function') {
                 listener.apply(self, eventManager.eventArguments);
              } else if ((typeof listener === 'object') && (typeof listener[eventName] === 'function')) {
                listener[eventName].apply(self, eventManager.eventArguments);
              }
            });
          };

          var clearTimer = function () {
            clearTimeout(eventManager.intervalTimeoutId);
            eventManager.intervalTimeoutId = null;
          };

          var setTimer = function () {
            if (!eventManager.intervalTimeoutId) {
              eventManager.intervalTimeoutId = setTimeout(function () {
                clearTimer();
                runListeners();
              }, minimumEmitInterval);
            }
          };

          if (lastEmitTime < (time_now - minimumEmitInterval)) {
             clearTimer();
             runListeners();
          } else {
             setTimer();
          }

          return self;
        },
        throttle: function (minimumInterval) {
          minimumInterval = (typeof minimumInterval === 'number') ? minimumInterval : 1;
          minimumInterval = Math.max(minimumInterval, 1);
          eventManager.minimumEmitInterval = minimumInterval;
          return self;
        },
        listeners: function () {
          return listeners;
        }
      };

      // assign the event listener registration function to the specified name
      obj[eventName] = function(listener) {
        self = this;
        if (typeof listener === 'function') {
          listeners.push(listener);
          return this;
        }

        return eventManager;
      };

      obj[eventName].__eventifyEvent = true;
   }

   return {
     define: function () {
       Array.toArray(arguments).forEach(function (eventName) {
         installEvent(source, eventName);
       });
       return source;
     }
   };
}

function deventify (obj) {

  for (var m in obj) {
    if (obj[m] && obj[m].__eventifyEvent) {
      obj[m]().unbindAll();
    }
  }

  return obj;
}

