eventify.EventListener = (function () {

  function EventListener (options) {

    this._delegate        = options.listener;
    this._callInterval    = options.callInterval;
    this._hasCallInterval = typeof this._callInterval === 'number';
    this._callCount       = 0;

    if (typeof options.maxCallCount === 'number') {
      this._hasMaxCallCount = true;
      this._maxCallCount    = options.maxCallCount;
    }
  }

  EventListener.prototype = {
    _hasExpired: function () {
      return this._hasMaxCallCount && (this._callCount >= this._maxCallCount);
    }
  , _call: function (time, source, args) {
      if (!this._hasMaxCallCount || (this._hasMaxCallCount && (this._callCount < this._maxCallCount))) {
        this._lastCallTime = time;
        this._callCount++;
        return this._delegate.apply(source, args);
      }
    }
  , _callNow: function (source, args) {

      var self = this
        , time = new Date().getTime();

      // if there is a time set, clear it
      if (self._intervalTimeoutId) {
        clearTimeout(self._intervalTimeoutId);
        delete self._intervalTimeoutId;
      }

      if (self._hasCallInterval) {

        var lastCallTime        = self._lastCallTime || 0
          , intervalElapsed     = lastCallTime < (time - self._callInterval);

        if (!intervalElapsed) {

          // throttle the emission, set a timer which when triggered calls with the most recent arguments

          // stash the most recent arguments for when the interval elapses
          self._stashedCallArgs = args;

          if (!self._intervalTimeoutId) {
            self._intervalTimeoutId = setTimeout(function () {
              self._call(time, source, self._stashedCallArgs);
              delete self._stashedCallArgs;
            }, self._callInterval);
          }

          return;
        }
      }

      self._call(time, source, args);
    }
  , _callOnNextTick: function (source, args) {
      return this._callAfterN(source, args, 0);
    }
  , _callAfterN: function (source, args, n) {
      var self = this;

      return setTimeout(function () {
        self._callNow(source, args);
      }, n);
    }
  };

  return EventListener;
})();