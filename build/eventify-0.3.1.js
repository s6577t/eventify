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
*/;function eventify(source) {

   // register a new event for the source
   function installEvent (eventName) {

      var eventManager = new eventify.EventManager(source, eventName);

      // assign the event listener registration function to the specified name
      source[eventName] = function(listener) {
        if (listener) return eventManager.bind(listener);
        return eventManager;
      };

      source[eventName].__eventifyEvent = true;
   }

   return {
     define: function (eventName, options) {
       options = options || {};

       installEvent(eventName);

       if (options.oneTimeEvent) {
         source[eventName]().oneTimeEvent();
       }

       return this;
     }
   };
}

eventify.removeAllListeners = function (object) {

  for (var member in object) {
    if (object[member] && object[member].__eventifyEvent) {
      object[member]().unbindAll();
    }
  }

  return object;
}

;eventify.EventListener = (function () {

  function EventListener (options) {

    this.listener        = options.listener;
    this.emitInterval    = options.emitInterval;
    this.hasEmitInterval = typeof this.emitInterval === 'number';
    this._callCount      = 0;

    if (typeof options.maxCallCount === 'number') {
      this.hasMaxCallCount = true;
      this.maxCallCount    = options.maxCallCount;
    }
  }

  EventListener.prototype = {
    _call: function (time, source, args) {
      if (!this.hasMaxCallCount || (this.hasMaxCallCount && (this._callCount < this.maxCallCount))) {
        this._lastCallTime = time;
        this._callCount++;
        return this.listener.apply(source, args);
      }
    }
  , hasExpired: function () {
      return this.hasMaxCallCount && (this._callCount >= this.maxCallCount);
    }
  , callNow: function (source, args) {

      var self = this
        , time = new Date().getTime()

      if (self.hasEmitInterval) {

        var lastCallTime        = self._lastCallTime || 0
          , intervalElapsed     = lastCallTime < (time - self.emitInterval);

        if (!intervalElapsed) {

          // throttle the emission, set a timer which when triggered emits with the most recent arguments

          // stash the most recent arguments for when the interval elapses
          self._stashedEmitArgs = args;

          if (!self._intervalTimeoutId) {
            self._intervalTimeoutId = setTimeout(function () {
              self._call(time, source, self._stashedEmitArgs);
              delete self._stashedEmitArgs;
            }, self.emitInterval);
          }

          return;
        }
      }
      
      this._call(time, source, args);
    }
  , callOnNextTick: function (source, args) {
      return this.callAfterN(source, args, 0);
    }
  , callAfterN: function (source, args, n) {
      var self = this;

      return setTimeout(function () {
        self.callNow(source, args);
      }, n);
    }
  };

  return EventListener;
})();;eventify.EventManager = (function () {

  function callEventListeners (args) {
    var self = this;

    // if there is a time set, clear it
    if (self._intervalTimeoutId) {
      clearTimeout(this._intervalTimeoutId);
      delete this._intervalTimeoutId;
    }

    for (var i = 0, l = self._listeners.length; i < l; i++) {

      var listener = self._listeners[i];

      listener.callNow(self.source, args);
      
      if (listener.hasExpired()) {
        l--;
        i--;
        self._listeners.splice(i, 1);
      }
    }

    if (self._oneTimeEvent) self.unbindAll();
  }

  function EventManager (source, eventName) {
    this.source     = source;
    this.eventName  = eventName;
    this._listeners = [];
  };

  EventManager.prototype = {
    bind: function (options) {

      var listener
        , optionsType = typeof options;

      switch (optionsType) {
        case 'function':
          listener = new eventify.EventListener({
            listener: options
          });
          break;
        case 'object':
          listener = new eventify.EventListener(options);
          break;
        default:
          throw new TypeError('options type not valid: ' + optionsType);
      }

      if (this._oneTimeEvent && this._oneTimeEventPassed) {
        listener.callOnNextTick(this.source, this._oneTimeEventEmitArgs);
      }

      this._listeners.push(listener);

      return new eventify.EventSubscription(this, listener);
    }
  , unbind: function (listenerToRemove) {

      this._listeners = this._listeners.filter(function(registeredListener){
        return registeredListener !== listenerToRemove && registeredListener.listener !== listenerToRemove;
      });

      return this.source;
    }
  , unbindAll: function (listenerToRemove) {
      this._listeners = [];
      return this.source;
    }
  , emit: function () {

      var source    = this.source
        , self      = this;

      if (self._oneTimeEvent) {
        if (self._oneTimeEventPassed) {
          return false;
        } else {
          self._oneTimeEventEmitArgs = arguments;
          self._oneTimeEventPassed   = true;
        }
      }

      callEventListeners.call(self, arguments);

      return true;
    }
  , withInterval: function (emitInterval, listener) {
      return this.bind({
        listener: listener
      , emitInterval: emitInterval
      });
    }
  , listeners: function () {
      return this._listeners;
    }
  , once: function (listener) {
      return this.nTimes(1, listener)
    }
  , nTimes: function (n, listener) {
      return this.bind({
        listener: listener
      , maxCallCount: n
      });
    }
  , oneTimeEvent: function () {
      this._oneTimeEvent          = true;
      this._oneTimeEventPassed = false;
      return this.source;
    }
  };

  return EventManager;
})();eventify.EventSubscription = (function () {

  function EventSubscription (sourceEventManager, listener) {
    this.sourceEventManager = sourceEventManager;
    this.listener           = listener;
    this._active            = true;
  }

  EventSubscription.prototype = {
    cancel: function () {
      
      if (this.isActive()) {
        this._active = false;
        this.sourceEventManager.unbind(this.listener.listener);
        return true;
      }

      return false;
    }
  , isActive: function () {
      return this._active;
    }
  }

  return EventSubscription;
})();;