describe("eventify", function() {
  var object;

  beforeEach(function () {
    object = {};
  })

  describe("defining events", function() {

    it("should allow events to be defined through a chainable interface", function() {
      eventify(object)
        .define('onBoo')
        .define('onMangle')
        .define('onWhatever');

      expect(object['onMangle']()).toBeInstanceOf(eventify.EventManager);
      expect(object['onBoo']()).toBeInstanceOf(eventify.EventManager);
      expect(object['onWhatever']()).toBeInstanceOf(eventify.EventManager);
    });

    it("should allow an event to be defined as a one time event", function() {
      eventify(object).define('onDrag', { oneTimeEvent: true });
      expect(object.onDrag()._oneTimeEvent).toBe(true);
    });
  });

  describe("passing an event listener", function() {

    beforeEach(function () {
      eventify(object).define('onSomeEvent');
    });

    it("should call bind() with the listener on the event manager", function() {
      function handler() {};
      spyOn(object.onSomeEvent(), 'bind');
      object.onSomeEvent(handler);
      expect(object.onSomeEvent().bind).toHaveBeenCalledWith(handler);
    });

    it("should return an event subscription", function () {
      expect(object.onSomeEvent(function () {})).toBeInstanceOf(eventify.EventSubscription);
    });
  });
});