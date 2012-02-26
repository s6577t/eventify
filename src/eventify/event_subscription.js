eventify.EventSubscription = (function () {

  function EventSubscription (args) {

    this._active                        = true;
    this._eventListener                 = args.eventListener;
    this._subscriptions                 = args.subscriptions;

    if (args.cancel) {
      this._active = false;
    } else {
      this._subscriptions._add(this);
    }
  }

  EventSubscription.prototype = {
    cancel: function () {

      if (this.isActive()) {
        this._active = false;
        this._subscriptions._remove(this);

        return true;
      }

      return false;
    }
  , isActive: function () {
      return this._active;
    }
  }

  return EventSubscription;
})();