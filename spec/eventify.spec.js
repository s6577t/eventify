describe("eventifying an object", function() {
  var object;

  beforeEach(function () {
    object = {};
  })

  describe("defining events", function() {

    it("should allow events to be defined through a chainable interface", function() {

      eventify(object, function () {
        this.define('onBoo');
        this.define('onMangle');
        this.define('onWhatever');
      });

      expect(object['onMangle']()).toBeInstanceOf(eventify.EventManager);
      expect(object['onBoo']()).toBeInstanceOf(eventify.EventManager);
      expect(object['onWhatever']()).toBeInstanceOf(eventify.EventManager);
    });

    it("should allow an event to be defined as a one time event", function() {
      eventify(object, function () {
        this.define('onDrag', { oneTimeEvent: true });
      });
      expect(object.onDrag()._oneTimeEvent).toBe(true);
    });
  });

  describe("passing an event listener", function() {

    beforeEach(function () {
      eventify(object, function () {
        this.define('onSomeEvent');
      });
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

  it('passes the configurationApi as an argument and as the context of the configuration function', function () {
    var context, arg;
    eventify({}, function (a) {
      context = this;
      arg = a;
    });
    
    expect(arg).toBe(context);
  });
  
  it("returns the eventified object", function() {
    var obj = {};
    expect(eventify(obj, function () {})).toBe(obj);
  });
});