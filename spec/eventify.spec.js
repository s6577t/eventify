describe("eventify", function() {

  it("returns the objects events mixin", function() {
      
    var obj = {};

    var rtn = eventify(obj);

    expect(rtn).toBe(obj.events);
    expect(rtn).toBeInstanceOf(eventify.EventsMixin);
  });

  it("does not throw an error when eventifying a previously eventified object", function() {
    
    var obj = {};
    eventify(obj);

    expect(function () {
      eventify(obj);
    }).not.toThrow();
  });

  describe('specifying a global events namesapce', function () {

    it("allows a global event namespace to be defined", function() {
      
      var obj = {};
      
      eventify(obj, 'my-ns');

      expect(obj.events.namespace()).toBe('my-ns');
    });

    it("allows namespace to have slashes", function () {
      
      var obj = {};

      expect(function () {
        eventify(obj, 'in/a/slash');
      }).not.toThrow();
      
      expect(obj.events.namespace()).toBe('in/a/slash');
    });

    it('throws an error if a namespace has already been defined', function () {
      
      var obj = {};
      eventify(obj, 'namespace');

      expect(function () {
        eventify(obj, 'namespace');
      }).toThrow('Object already has an events namespace');
    });
  });
});
