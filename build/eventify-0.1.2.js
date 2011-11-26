/*  Copyright (C) 2011 by sjltaylor

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicence, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/;function deventify (object) {

  for (var member in object) {
    if (object[member] && object[member].__eventifyEvent) {
      object[member]().unbindAll();
    }
  }

  return object;
};function eventify(source) {

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

;