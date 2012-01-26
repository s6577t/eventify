describe('event listener', function () {

  var obj, listener, eventListener;

  beforeEach(function () {
    obj = { listener: function () {} };

    listener = obj.listener;

    eventListener = new eventify.EventListener({
      listener: obj.listener
    });
  });

  describe('with maximum call count and an listen interval', function () {

    beforeEach(function () {
      eventListener = new eventify.EventListener({
        listener: listener
      , callInterval: 20
      , maxCallCount: 1
      });
    });

    it("it should not emit an event more than the max call count even when the listener is called after a timeout", function() {
      eventListener.callNow();
      eventListener.callNow();
      eventListener.callNow();
      eventListener.callNow();
      eventListener.callNow();
      
      waits(20);
      
      runs(function () {
        expect(eventListener.callCount()).toBe(1);
      });
    });
  });

  describe('callCount()', function () {
    it("return the number of times the listener has been called", function() {
      expect(eventListener.callCount()).toBe(0);

      eventListener.callNow();
      expect(eventListener.callCount()).toBe(1);

      for(var i = 0; i < 10; i++) eventListener.callNow();
      expect(eventListener.callCount()).toBe(11);
    });
  })


  describe("callInterval()", function() {
    it("returns the emit interval if there is one", function() {
      
      var eventListener = new eventify.EventListener({
        listener: listener
      , callInterval: 200
      , maxCallCount: 1
      });

      expect(eventListener.callInterval()).toBe(200);
    });
  });

  describe("maxCallCount()", function() {
    it("returns the max call count if there is one", function() {
      
      var eventListener = new eventify.EventListener({
        listener: listener
      , callInterval: 200
      , maxCallCount: 111
      });

      expect(eventListener.maxCallCount()).toBe(111);
    });
  });
});