eventify.Subscription = (function () {

  var idSpool = 0;

  function Subscription (args) {

    if (typeof args.listener !== 'function') {
      throw new Error('a listener function must be provided')
    }

    this.__id__            = ++idSpool;
    this.__listener__      = args.listener;
    this.__subscriptions__ = args.subscriptions;
    this.__listenCount__   = 0;

    this.__activate__();
  }

  Subscription.prototype = {
    __hasExpired__: function () {
      
      return !!(this.__hasMaxCallCount__ && (this.__listenCount__ >= this.__maxCallCount__));
    }
  , __activate__: function () {
      
      this.__active__ = true;
      this.__subscriptions__.__add__(this);
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
  , throttle: function (callInterval) {
      this.__callInterval__ = callInterval;
      this.__hasCallInterval__ = typeof this.__callInterval__ === 'number';
      return this;
    }
  , once: function () {
      
      return this.nTimes(1)
    }
  , nTimes: function (n) {
      
      var expiredBefore = this.__hasExpired__();

      this.__maxCallCount__ = n;
      this.__hasMaxCallCount__ = typeof n === 'number';
      
      var expiredNow = this.__hasExpired__();

      if (expiredBefore !== expiredNow) {
        if (expiredNow) {
          this.cancel();
        } else {
          this.__activate__();
        }
      }

      return this;
    }
  }

  return Subscription;
})();