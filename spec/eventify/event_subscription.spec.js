describe("eventify.EventSubscription", function() {

  var object, eventListener;

  beforeEach(function () {

    object = {
      listener: function () {}
    };

    eventListener = new eventify.EventListener({
      listener: object.listener
    });

    eventify(object, function () {
      this.define('onSomeEvent');
      this.define('onOneTime', { oneTimeEvent: true })
    });
  });

  describe("subscribing to an event", function() {

    it("throws an error if no listener is specified", function() {
      expect(function () {
        new EventSubscription({
          event: object.onSomeEvent()
        });
      }).toThrow();
    });

  });

  describe("#cancel()", function() {
    it("results the the listener no longer being called", function() {

      spyOn(object, 'listener');

      object.onSomeEvent(object.listener).cancel();

      object.onSomeEvent().emit();

      expect(object.listener).not.toHaveBeenCalled();
    });

    it("returns true when called the first time", function() {
      var eventSubscription = object.onSomeEvent(object.listener);
      expect(eventSubscription.cancel()).toBe(true);
    });

    it("returns false on any successive calls", function() {
      var eventSubscription = object.onSomeEvent(object.listener);
      eventSubscription.cancel();
      expect(eventSubscription.cancel()).toBe(false);
      expect(eventSubscription.cancel()).toBe(false);
      expect(eventSubscription.cancel()).toBe(false);
    });

  });

  describe("#isActive()", function() {
    it("indicates whether the event subscription is active", function() {
      var eventSubscription = object.onSomeEvent(object.listener);

      expect(eventSubscription.isActive()).toBe(true);
      eventSubscription.cancel();
      expect(eventSubscription.isActive()).toBe(false);
    });
  });

});