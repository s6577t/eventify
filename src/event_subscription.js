eventSource.EventSubscription = (function () {

  function EventSubscription (sourceEventManager, listener) {
    this.sourceEventManager = sourceEventManager;
    this.listener           = listener;
  }

  EventSubscription.prototype = {
    cancel: function () {
      var listener = this.listener;
      this.sourceEventManager.unbind(listener);
      delete this.listener;
      delete this.sourceEventManager;
      return listener;
    }
  , isActive: function () {
      return !!(this.sourceEventManager && this.listener);
    }
  }

  return EventSubscription;
})();