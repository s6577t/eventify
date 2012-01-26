describe('eventify.removeAllListeners()', function () {

  var object;

  beforeEach(function () {
    object = {};
  });

  it ('should not get a type error for null members', function () {
    object.nil = null;

    expect(function () {
      eventify.removeAllListeners(object);
    }).not.toThrow();
  });

  it('should remove all listeners for events installed by events', function () {
    eventify(object, function () {
      this.define('onDo');
      this.define('onDont');
    });
    eventify.removeAllListeners(object);
    expect(object.onDo().listeners().length).toEqual(0);
    expect(object.onDont().listeners().length).toEqual(0);
  });

  it("should leave all events on the object", function() {
    eventify(object, function () {
      this.define('onDo');
      this.define('onDont');
    });
    eventify.removeAllListeners(object);
    expect(object.onDo).not.toBeUndefined();
    expect(object.onDont).not.toBeUndefined();
  });

  it('should return the deventified object', function () {
    expect(eventify.removeAllListeners(object)).toBe(object);
  })
});