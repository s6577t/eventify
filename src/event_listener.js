eventify.EventListener = (function () {

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
        , time = new Date().getTime();

      // if there is a time set, clear it
      if (self._intervalTimeoutId) {
        clearTimeout(self._intervalTimeoutId);
        delete self._intervalTimeoutId;
      }

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
})();