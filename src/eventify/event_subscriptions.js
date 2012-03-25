eventify.Subscriptions = (function () {

  function Subscriptions (event) {
    this.__subscriptions__ = {};
  }

  Subscriptions.prototype = {
    __add__: function (subscription) {
      this.__subscriptions__[subscription.__id__] = subscription;
    }
  , __remove__: function (subscription) {
      delete this.__subscriptions__[subscription.__id__];
    }
  , __invokeAllNow__: function (source, args) {
      this.each(function (subscription) {
        subscription.__invokeNow__(source, args);
      });
    }
  , cancelAll: function () {
      this.each(function (subs) {
        subs.cancel();
      });
    }
  , each: function (f) {
      
      return object(this.__subscriptions__).each(f);
    }
  , count: function () {
      
      return Object.keys(this.__subscriptions__).length;
    }
  , toArray: function () {
      
      return object(this.__subscriptions__).toArray();
    }
  };

  return Subscriptions;
})();