describe("eventSource", function() {
  var object;

  beforeEach(function () {
    object = {};
  })

  describe("defining events", function() {

    it("should allow events to be defined through a chainable interface", function() {
      eventSource(object)
        .define('onBoo')
        .define('onMangle')
        .define('onWhatever');

      expect(object['onMangle']()).toBeInstanceOf(eventSource.EventManager);
      expect(object['onBoo']()).toBeInstanceOf(eventSource.EventManager);
      expect(object['onWhatever']()).toBeInstanceOf(eventSource.EventManager);
    });

    it("should allow an event to be defined with an emit interval", function() {
      eventSource(object).define('onDrag', { emitInterval: 1234 });
      expect(object.onDrag().emitInterval()).toEqual(1234);
    });

    it("should allow an event to be defined as a one time event", function() {
      eventSource(object).define('onDrag', { oneTimeEvent: true });
      expect(object.onDrag()._oneTimeEvent).toBe(true);
    });
  });

  describe("passing an event listener", function() {

    beforeEach(function () {
      eventSource(object).define('onSomeEvent');
    });

    it("should call bind() with the listener on the event manager", function() {
      function handler() {};
      spyOn(object.onSomeEvent(), 'bind');
      object.onSomeEvent(handler);
      expect(object.onSomeEvent().bind).toHaveBeenCalledWith(handler);
    });

    it("should return an event subscription", function () {
      expect(object.onSomeEvent(function () {})).toBeInstanceOf(eventSource.EventSubscription);
    });
  });
});