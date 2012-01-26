eventify.EventListener = (function () {

  function EventListener (options) {

    this.listener         = options.listener;
    this._callInterval    = options.callInterval;
    this._hasEmitInterval = typeof this._callInterval === 'number';
    this._callCount       = 0;

    if (typeof options.maxCallCount === 'number') {
      this._hasMaxCallCount = true;
      this._maxCallCount    = options.maxCallCount;
    }
  }

  EventListener.prototype = {
    _call: function (time, source, args) {
      if (!this._hasMaxCallCount || (this._hasMaxCallCount && (this._callCount < this.maxCallCount()))) {
        this._lastCallTime = time;
        this._callCount++;
        return this.listener.apply(source, args);
      }
    }
  , hasExpired: function () {
      return this._hasMaxCallCount && (this._callCount >= this.maxCallCount());
    }
  , callNow: function (source, args) {

      var self = this
        , time = new Date().getTime();

      // if there is a time set, clear it
      if (self._intervalTimeoutId) {
        clearTimeout(self._intervalTimeoutId);
        delete self._intervalTimeoutId;
      }

      if (self._hasEmitInterval) {

        var lastCallTime        = self._lastCallTime || 0
          , intervalElapsed     = lastCallTime < (time - self.callInterval());

        if (!intervalElapsed) {

          // throttle the emission, set a timer which when triggered emits with the most recent arguments

          // stash the most recent arguments for when the interval elapses
          self._stashedEmitArgs = args;

          if (!self._intervalTimeoutId) {
            self._intervalTimeoutId = setTimeout(function () {
              self._call(time, source, self._stashedEmitArgs);
              delete self._stashedEmitArgs;
            }, self.callInterval);
          }

          return;
        }
      }

      self._call(time, source, args);
    }
  , callInterval: function () {
      return this._callInterval;
    }
  , maxCallCount: function () {
      return this._maxCallCount;
    }
  , callCount: function () {
      return this._callCount;
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