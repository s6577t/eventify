eventify.EventSubscription = (function () {

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
})();