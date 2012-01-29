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
      eventListener._callNow();
      eventListener._callNow();
      eventListener._callNow();
      eventListener._callNow();
      eventListener._callNow();
      
      waits(20);
      
      runs(function () {
        expect(eventListener._callCount).toBe(1);
      });
    });
  });

});