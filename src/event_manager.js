eventify.EventManager = (function () {

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

    if (self.__queue) self.unbindAll();
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
        if (self.__queue && !self.__queueAvailable) {
          listener.apply(self.source, self._queueEmitArgs);
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
        , throttled = !!this._minimumEmitInterval;

      if (this.__queue) {
        if (this.__queueAvailable) {
          self._queueEmitArgs = arguments;
          this.__queueAvailable = false;
        } else {
          return this.source;
        }
      }

      if (throttled) {

        var lastEmitTime        = this._lastEmitTime || 0
          , minimumEmitInterval = this._minimumEmitInterval
          , intervalElapsed     = lastEmitTime < (emitTime - minimumEmitInterval);

        if (!intervalElapsed) {

          // throttle the emission, setting a timer for to call with the most recetn arguments when the interval elapses

          // stash the most recent arguments for when the interval elapses
          self._stashedEmitArgs = arguments;

          if (!self._intervalTimeoutId) {
            self._intervalTimeoutId = setTimeout(function () {
              callEventListeners.call(self, emitTime, self._stashedEmitArgs);
              delete self._stashedEmitArgs;
            }, minimumEmitInterval);
          }

          return self.source;
        }
      }

      callEventListeners.call(self, emitTime, arguments);

      return self.source;
    }
    , throttle: function (minimumInterval) {

      if (minimumInterval === null) {
        delete this._minimumEmitInterval;
      } else {
        minimumInterval = (typeof minimumInterval === 'number') ? minimumInterval : 10;
        minimumInterval = Math.max(minimumInterval, 1);

        this._minimumEmitInterval = minimumInterval;
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
    , queue: function () {
      this.__queue          = true;
      this.__queueAvailable = true;
      return this.source;
    }
  };

  return EventManager;
})()