describe("eventify", function() {
  var object;

  beforeEach(function () {
    object = {};
  })

  describe("defining events", function() {

    it("causes the target to have members of corresponding name", function() {
      eventify(object).define('onSomeEvent');
      expect(object.onSomeEvent).toBeAFunction();
    });

    it("should return the eventified object", function() {
      expect(eventify(object).define('onEventName')).toBe(object);
    });
  });
});