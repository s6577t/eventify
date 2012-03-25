eventify.Subscription = (function () {

  var idSpool = 0;

  function Subscription (args) {

    this.__id__            = ++idSpool;
    this.__active__        = true;
    this.__listener__      = args.listener;
    this.__subscriptions__ = args.subscriptions;
    this.__listenCount__   = 0;

    if (args.cancel) {
      this.__active__ = false;
    } else {
      this.__subscriptions__.__add__(this);
    }
  }

  Subscription.prototype = {
    __hasExpired__: function () {
      
      return this._hasMaxCallCount && (this._callCount >= this._maxCallCount);
    }
  , __invoke__: function (time, source, args) {
      
      if (!this.__hasExpired__()) {
        
        this.__lastCallTime__ = time;
        this.__listenCount__++;
        
        if (this.__hasExpired__()) {
          this.cancel();
        }

        return this.__listener__.apply(source, args);
      }
    }
  , __invokeNow__: function (source, args) {

      var thou = this
        , time = new Date().getTime();

      // if there is a time set, clear it
      if (thou.__intervalTimeoutId__) {
        clearTimeout(thou.__intervalTimeoutId__);
        delete thou.__intervalTimeoutId__;
      }

      if (thou.__hasCallInterval__) {

        var lastCallTime        = thou.__lastCallTime__ || 0
          , intervalElapsed     = lastCallTime < (time - thou.__callInterval__);

        if (!intervalElapsed) {

          // throttle the emission, set a timer which when triggered calls with the most recent arguments

          // stash the most recent arguments for when the interval elapses
          thou.__stashedCallArgs__ = args;

          if (!thou.__intervalTimeoutId__) {
            thou.__intervalTimeoutId__ = setTimeout(function () {
              thou.__invoke__(time, source, thou.__stashedCallArgs__);
              delete thou.__stashedCallArgs__;
            }, thou.__callInterval__);
          }

          return;
        }
      }

      thou.__invoke__(time, source, args);
    }
  , __invokeOnNextTick__: function (source, args) {
      
      return this.__invokeAfterN__(source, args, 0);
    }
  , __invokeAfterN__: function (source, args, n) {
      var thou = this;

      return setTimeout(function () {
        thou.__invokeNow__(source, args);
      }, n);
    }
  , cancel: function () {

      if (this.isActive()) {
        this.__active__ = false;
        this.__subscriptions__.__remove__(this);

        return true;
      }

      return false;
    }
  , isActive: function () {
      return this.__active__;
    }
  , throttle: function (callInterval, listener) {
      return this._listen({
        listener: listener
      , callInterval: callInterval
      });
    }
  , once: function (listener) {
      return this.nTimes(1, listener)
    }
  , nTimes: function (n, listener) {
      //if (typeof options.maxCallCount === 'number') {
      //   this._hasMaxCallCount = true;
      //   this._maxCallCount    = options.maxCallCount;
      // }
      return this._listen({
        listener: listener
      , maxCallCount: n
      });
    }
  }

  return Subscription;
})();