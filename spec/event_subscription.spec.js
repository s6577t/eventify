describe("eventSource.EventSubscription", function() {
  var object;
  function listener1 () {}

  beforeEach(function () {
    object = {};
    eventSource(object)
      .define('onSomeEvent');
  });

  describe("cancel()", function() {
    it("should unbind() the listener", function() {

      spyOn(object.onSomeEvent(), 'unbind');

      var eventSubscription = object.onSomeEvent(listener1);
      eventSubscription.cancel();

      expect(object.onSomeEvent().unbind).toHaveBeenCalledWith(listener1);
    });

    it("it should return the listener", function() {
      var eventSubscription = object.onSomeEvent(listener1);
      expect(eventSubscription.cancel()).toBe(listener1);
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