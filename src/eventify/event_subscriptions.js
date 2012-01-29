eventify.EventSubscriptions = (function () {

  function EventSubscriptions (event) {
    this._subscriptions = [];
  }

  EventSubscriptions.prototype = {
    _add: function (eventSubscription) {
      this._subscriptions.push(eventSubscription);
    }
  , _remove: function (eventSubscriptionToRemove) {
      this._subscriptions = this._subscriptions.filter(function(eventSubscription){
        return eventSubscription !== eventSubscriptionToRemove;
      });
    }
  , _callAll: function (source, args) {

      for (var i = 0, len = this._subscriptions.length; i < len; i++) {

        var subscription = this._subscriptions[i];

        subscription._eventListener._callNow(source, args);

        if (subscription._eventListener._hasExpired()) {
          i--;
          len--;
          subscription.cancel();
        }
      }
    }
  , cancelAll: function () {
      this._subscriptions.forEach(function (subs) {
        subs._active = false;
      });
      this._subscriptions = [];
    }
  , forEach: function (f) {
      return this._subscriptions.forEach(f);
    }
  , count: function () {
      return this._subscriptions.length;
    }
  , toArray: function () {
      return this._subscriptions.splice(0, this._subscriptions.length);
    }
  };

  return EventSubscriptions;
})();