function eventify(source) {

   // register a new event for the source
   function installEvent (obj, eventName) {
      var listeners = [];

      var eventManager = {
        self: null
        , unbind: function (listenerToRemove) {
          listeners = listeners.filter(function(registeredListener){
            return registeredListener != listenerToRemove;
          });
          return this.self;
        }
        , unbindAll: function (listenerToRemove) {
          listeners = [];
          return this.self;
        }
        , emit: function () {

          var timeNow = new Date().getTime();
          var lastEmitTime = parseInt(eventManager.lastEmitTime, 10) || 0;
          var minimumEmitInterval = parseInt(eventManager.minimumEmitInterval, 10) || 0;
          eventManager.eventArguments = arguments;

          var runListeners = function () {
            eventManager.lastEmitTime = timeNow;
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

          if (lastEmitTime < (timeNow - minimumEmitInterval)) {
             clearTimer();
             runListeners();
          } else {
             setTimer();
          }

          return this.self;
        }
        , throttle: function (minimumInterval) {
          minimumInterval = (typeof minimumInterval === 'number') ? minimumInterval : 10;
          minimumInterval = Math.max(minimumInterval, 1);
          eventManager.minimumEmitInterval = minimumInterval;
          return this.self;
        }
        , listeners: function () {
          return listeners;
        }
      };

      // assign the event listener registration function to the specified name
      obj[eventName] = function(listener) {
        eventManager.self = this;

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

