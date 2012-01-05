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
*/;function events(source) {

   // register a new event for the source
   function installEvent (eventName) {

      var eventManager = new events.EventManager(source, eventName);

      // assign the event listener registration function to the specified name
      source[eventName] = function(listener) {
        if (listener) return eventManager.bind(listener);
        return eventManager;
      };

      source[eventName].__eventsEvent = true;
   }

   return {
     define: function () {
       for (var i = 0; i < arguments.length; i++) {
         installEvent(arguments[i]);
       }       
       return source;
     }
   };
}

events.remove = function (object) {

  for (var member in object) {
    if (object[member] && object[member].__eventsEvent) {
      object[member]().unbindAll();
    }
  }

  return object;
}

;events.EventManager = (function () {

  function callEventListeners (emitTime, args) {
    var self = this;
    self._lastEmitTime = emitTime;

    // if there is a time set, clear it
    if (self._intervalTimeoutId) {
      clearTimeout(this._intervalTimeoutId);
      delete this._intervalTimeoutId;
    }

    for (var i = 0; i < self._listeners.length; ) {
      var listener = self._listeners[i];
      if (listener.__onceListener) {
        self._listeners.splice(i, 1);
      } else {
        i++;
      }
      listener.apply(self.source, args);
    }

    if (self._oneTimeEvent) self.unbindAll();
  }

  function EventManager (source, eventName) {
    this.source     = source;
    this.eventName  = eventName;
    this._listeners = [];
  };

  EventManager.prototype = {
    bind: function (listener) {
      var self = this;
      
      if (typeof listener === 'function') {
        if (self._oneTimeEvent && !self._oneTimeEventQueueAvailable) {
          listener.apply(self.source, self._oneTimeEventEmitArgs);
        }
        self._listeners.push(listener);
      }
      return self.source;
    }
    , unbind: function (listenerToRemove) {

      this._listeners = this._listeners.filter(function(registeredListener){
        return registeredListener != listenerToRemove;
      });

      return this.source;
    }
    , unbindAll: function (listenerToRemove) {
      this._listeners = [];
      return this.source;
    }
    , emit: function () {

      var emitTime  = new Date().getTime()
        , source    = this.source
        , self      = this
        , throttled = !!this._emitInterval;

      if (this._oneTimeEvent) {
        if (this._oneTimeEventQueueAvailable) {
          self._oneTimeEventEmitArgs = arguments;
          this._oneTimeEventQueueAvailable = false;
        } else {
          return false;
        }
      }

      if (throttled) {

        var lastEmitTime        = this._lastEmitTime || 0
          , minimumEmitInterval = this._emitInterval
          , intervalElapsed     = lastEmitTime < (emitTime - minimumEmitInterval);

        if (!intervalElapsed) {

          // throttle the emission, set a timer to call with the most recent arguments when the interval elapses

          // stash the most recent arguments for when the interval elapses
          self._stashedEmitArgs = arguments;

          if (!self._intervalTimeoutId) {
            self._intervalTimeoutId = setTimeout(function () {
              callEventListeners.call(self, emitTime, self._stashedEmitArgs);
              delete self._stashedEmitArgs;
            }, minimumEmitInterval);
          }

          return false;
        }
      }

      callEventListeners.call(self, emitTime, arguments);

      return true;
    }
    , throttle: function (minimumInterval) {

      if (minimumInterval === null) {
        delete this._emitInterval;
      } else {
        minimumInterval = (typeof minimumInterval === 'number') ? minimumInterval : 10;
        minimumInterval = Math.max(minimumInterval, 1);

        this._emitInterval = minimumInterval;
      }

      return this.source;
    }
    , listeners: function () {
      return this._listeners;
    }
    , once: function (listener) {
      listener.__onceListener = true;
      return this.bind(listener);
    }
    , oneTimeEvent: function () {
      this._oneTimeEvent          = true;
      this._oneTimeEventQueueAvailable = true;
      return this.source;
    }
  };

  return EventManager;
})();