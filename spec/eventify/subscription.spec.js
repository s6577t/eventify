describe("eventify.Subscription", function() {

  var obj, listener;

  beforeEach(function () {
    obj = {};
    eventify(obj).define('onSomeEvent');
  });

  it('throws an error if the constructor is not passed a listener', function () {
    expect(function () {
      new eventify.Subscription({})
    }).toThrow('a listener function must be provided');
  })

  describe("cancel()", function() {
    
    it('causes the subscription to be removed from the subscriptions for the event', function () {
      
      var subs = obj.onSomeEvent(function () {});
      subs.cancel();

      obj.onSomeEvent.subscriptions().each(function (s) {
        expect(s).not.toBe(subs);
      });
    });

    it("causes the listener to no longer be called", function() {

      var listener = jasmine.createSpy('listener');

      obj.onSomeEvent(listener).cancel();

      obj.onSomeEvent.emit();

      expect(listener).not.toHaveBeenCalled();
    });

    it("returns true when called the first time", function() {
      var subs = obj.onSomeEvent(function () {});
      expect(subs.cancel()).toBe(true);
    });

    it("returns false after the first call", function() {
      var subs = obj.onSomeEvent(function(){});
      subs.cancel();

      expect(subs.cancel()).toBe(false);
      expect(subs.cancel()).toBe(false);
      expect(subs.cancel()).toBe(false);
    });
  });

  describe("isActive()", function() {
    
    it("indicates whether the event subscription is active", function() {
      var subs = obj.onSomeEvent(function(){});

      expect(subs.isActive()).toBe(true);
      
      subs.cancel();
      
      expect(subs.isActive()).toBe(false);
    });
  });

  describe('throttle(interval)', function () {

    it('calls the listeners the first time the event is emitted and then not until the interval has elapsed, after which time the most recently emitted arguments are passed', function () {
      
      var callParams = [];

      runs(function() {

        var listener = function (value) {
          callParams.push(value);
        };

        obj.onSomeEvent(listener).throttle(200);

        for (var i = 0; i <= 100; i++) {
          obj.onSomeEvent.emit(i);
        }
      });

      waits(200);

      runs(function() {
        expect(callParams.length).toEqual(2)
        expect(callParams[0]).toEqual(0);
        expect(callParams[callParams.length-1]).toEqual(100);
      });
    });

    it('calls other event listeners every time the event is emitted', function () {

      var callParams      = []
      ,   otherCallParams = [];

      runs(function() {

        var listener = function (value) {
          callParams.push(value);
        };

        var listener2 = function (value) {
          otherCallParams.push(value);
        };

        obj.onSomeEvent(listener).throttle(20);
        obj.onSomeEvent(listener2);

        for (var i = 1; i <= 100; i++) {
          obj.onSomeEvent.emit(i);
        }
      });

      waits(20);

      runs(function() {
        expect(otherCallParams.length).toEqual(100);
      });
    });

    it("returns an event subscription", function () {
      expect(obj.onSomeEvent(function(){}).throttle(1234)).toBeInstanceOf(eventify.Subscription);
    });

    it("removes the stashed arguments from the event manager so as not to leak memory", function() {
      var callParams = [];

      runs(function() {

        var listener = function (value) {
          callParams.push(value);
        };

        obj.onSomeEvent(listener).throttle(20);

        for (var i = 0; i <= 100; i++) {
          obj.onSomeEvent.emit(i);
        }
      });

      waits(20);

      runs(function() {
        expect(obj.onSomeEvent.__stashedCallArgs__).toBeUndefined();
      });
    });
  });

  describe("once()", function() {

    it("is a shortcut for nTimes", function() {
      
      var listener = function () {};
      var subs = obj.onSomeEvent(listener);

      spyOn(subs, 'nTimes');

      subs.once();

      expect(subs.nTimes).toHaveBeenCalledWith(1);
    });

    it("returns an event subscription", function () {
      expect(obj.onSomeEvent(function(){}).once()).toBeInstanceOf(eventify.Subscription);
    });
  });

  describe("nTimes(n)", function() {

    [0, 1, 2, 10, 100].forEach(function (n) {
      it("only calls the listener " + n + " times", function() {
        var obj = {};

        eventify(obj).define('onEvent');

        var count = 0;

        obj.onEvent(function () {
          count++;
        }).nTimes(n);

        for (var i = 0; i <= n; i++) {
          obj.onEvent.emit();
        }

        expect(count).toEqual(n);
      });
    })

    it("returns an event subscription", function () {
      expect(obj.onSomeEvent(function(){}).nTimes(10)).toBeInstanceOf(eventify.Subscription);
    });

    it('cancels the subscription after the max call count is exceeded', function () {
      var subs = obj.onSomeEvent(function(){}).nTimes(1);
      obj.onSomeEvent.emit();
      expect(subs.isActive()).toBe(false);
    });

    it('causes an inactive event to become active when set higher than the call count', function () {
      
      var subs = obj.onSomeEvent(function () {}).nTimes(0);
      
      expect(subs.isActive()).toBe(false);

      subs.nTimes(10);

      expect(subs.isActive()).toBe(true);
    });
    
    describe("when the event is a single", function() {
      it("does not call the listener if the event has occurred", function() {
        
        obj.events.single('onInit');
        
        var listener  = jasmine.createSpy('listener')
          , listener2 = jasmine.createSpy('listener2');

        obj.onInit(listener);

        obj.onInit.emit();
        
        expect(listener).toHaveBeenCalled();

        // the event must have previosuly occurred for the callback on subscription
        obj.onInit(listener2).nTimes(0);
        
        waits(1);
        
        runs(function () {
          expect(listener2).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('with maximum call count and a listen interval', function () {

    var listener, subs;

    beforeEach(function () {

      listener = jasmine.createSpy('listener');

      subs = obj.onSomeEvent(listener)
        .throttle(40)
        .nTimes(3);
    });

    it("it should not emit an event more than the max call count even when the listener is called after a timeout", function() {
      
      obj.onSomeEvent.emit();
      obj.onSomeEvent.emit();
      obj.onSomeEvent.emit();
      obj.onSomeEvent.emit();
      obj.onSomeEvent.emit();
      
      waits(20);
      
      runs(function () {
        expect(subs.__listenCount__).toBe(1);
      });
    });
  });
});