describe("eventify.EventSubscription", function() {
  var object;
  function listener1 () {}

  beforeEach(function () {
    object = {};
    eventify(object, function () {
      this.define('onSomeEvent');
    });
  });

  describe("cancel()", function() {
    it("should unbind() the listener", function() {

      spyOn(object.onSomeEvent(), 'unbind');

      var eventSubscription = object.onSomeEvent(listener1);
      eventSubscription.cancel();

      expect(object.onSomeEvent().unbind).toHaveBeenCalledWith(listener1);
    });

    it("it should return true when called the first time", function() {
      var eventSubscription = object.onSomeEvent(listener1);
      expect(eventSubscription.cancel()).toBe(true);
    });

    it("returns false on any successive calls", function() {
      var eventSubscription = object.onSomeEvent(listener1);
      eventSubscription.cancel();
      expect(eventSubscription.cancel()).toBe(false);
      expect(eventSubscription.cancel()).toBe(false);
      expect(eventSubscription.cancel()).toBe(false);
    });
  });

  describe("isActive()", function() {
    it("should indicate whether the event subscription is active", function() {
      var eventSubscription = object.onSomeEvent(listener1);

      expect(eventSubscription.isActive()).toBe(true);
      eventSubscription.cancel();
      expect(eventSubscription.isActive()).toBe(false);
    });
  });
});