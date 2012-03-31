describe('eventify.EventMixin', function () {
  
  var obj;

  beforeEach(function () {
    obj = {};
    eventify(obj, 'namespace').define('onSomeEvent').single('onLoad');
  });

  describe('__listen__', function () {

    it("returns an event subscription", function () {
      
      expect(obj.onSomeEvent(function () {})).toBeInstanceOf(eventify.Subscription);
    });

    it("calls back on next tick if the event has occurred and is a single occurence event", function() {

      var listener = jasmine.createSpy('listener');

      obj.onLoad.emit(1,2,3);
      
      var subs = obj.onLoad(listener);
      
      expect(subs.isActive()).toBe(false);
      
      waits(1);

      runs(function () {
        expect(listener).toHaveBeenCalledWith(1,2,3);
        expect(subs.isActive()).toBe(false);
      })
    });

    it('allows an object and function name to be specified', function () {

      var listener = jasmine.createSpy();

      obj.onSomeEvent({ listener: listener }, 'listener');
      obj.onSomeEvent.emit();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe("subscriptions()", function() {
    it("returns an Subscriptions containing the event subscriptions", function() {

      var listener = function () {};
      
      var subscription = obj.onSomeEvent(listener);

      var subscriptions = obj.onSomeEvent.subscriptions();

      expect(subscriptions.count()).toEqual(1);
      expect(subscriptions.toArray()[0]).toBe(subscription);
    });
  });
  
  describe("eventName()", function() {
    
    it("returns the name of the event", function() {
      expect(obj.onSomeEvent.eventName()).toBe('onSomeEvent');
    });

    describe('specifying the namespace=true option', function () {
  
      it("returns the namespace and name of the event in the form <namespace>/<name>", function () {
        expect(obj.onSomeEvent.eventName({namespace:true})).toEqual('namespace/onSomeEvent');
      });    
    });
  });

  describe('emit()', function () {

    it('calls the listeners', function () {

      var listener1 = jasmine.createSpy('listener1')
        , listener2 = jasmine.createSpy('listener2');

      obj.onSomeEvent(listener1);
      obj.onSomeEvent(listener2);

      obj.onSomeEvent.emit();

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled();
    });

    it('passes arguments to listeners', function () {
      
      var listener = jasmine.createSpy('listener');
      obj.onSomeEvent(listener);

      obj.onSomeEvent.emit('hello', 123, false);

      expect(listener).toHaveBeenCalledWith('hello', 123, false);
    });

    it("returns true if the event is emitted", function() {
      
      expect(obj.onSomeEvent.emit()).toBe(true);
    });

    it("returns true if the event emit is throttled", function() {
      obj.onSomeEvent(function(){}).throttle(100);
      obj.onSomeEvent.emit();
      expect(obj.onSomeEvent.emit()).toBe(true);
    });

    it('calls listeners in the context specified', function () {
  
      var context = null;
      var eventHandler = {
        onSomeEvent: function () {
          context = this;
        }
      };

      obj.onSomeEvent(eventHandler, 'onSomeEvent');
      obj.onSomeEvent.emit();

      expect(context).toBe(eventHandler);
    });

    describe("when the event is a single event", function() {

      it("does not call listeners more than once", function() {
        var calls = 0;

        obj.onLoad(function () {
          calls++;
        });

        obj.onLoad.emit();
        obj.onLoad.emit();

        expect(calls).toBe(1);
      });

      it("calls event handlers in the normal way the first time the event is emitted", function() {
        var listener = jasmine.createSpy('listener');

        obj.onLoad(listener);

        expect(listener).not.toHaveBeenCalled();

        obj.onLoad.emit();

        expect(listener).toHaveBeenCalled();
      });

      it("returns false if the event is a single event and has already been emitted", function() {
        
        obj.onLoad.emit();
        expect(obj.onLoad.emit()).toBe(false);
      }); 
      
      it("causes existing subscriptions to become inactive", function() {

        var subs = obj.onLoad(function () {});

        obj.onLoad.emit();

        expect(subs.isActive()).toBe(false);
      });
    });

    describe("global event emission", function() {
      
      it('calls the eventify __emit__ function which handles global listeners', function () {
        spyOn(eventify, '__emit__');

        obj.onSomeEvent.emit(1,2,3,4);

        expect(eventify.__emit__).toHaveBeenCalledWith({
          source: obj
        , args: [1,2,3,4]
        , eventName: 'namespace/onSomeEvent'
        });
      });

      it('does not call the eventify __emit__ function if the event is a single event and has occurred', function () {
        
        obj.onLoad.emit();

        spyOn(eventify, '__emit__');

        obj.onLoad.emit();

        expect(eventify.__emit__).not.toHaveBeenCalled();
      });

      it('does not call the eventify __emit__ function if the events source has no namespace', function () {
        var obj = {};
        eventify(obj).define('onSomething');
        spyOn(eventify, '__emit__');

        obj.onSomething.emit();

        expect(eventify.__emit__).not.toHaveBeenCalled();
      });
    });
  });

  describe('emitWithArgs()', function () {
    it('calls emit with the specified arguments', function () {
      spyOn(obj.onSomeEvent, 'emit');
      obj.onSomeEvent.emitWithArgs([1,2,3,4]);
      expect(obj.onSomeEvent.emit).toHaveBeenCalledWith(1,2,3,4);
    });
  });

  describe("emitOnNextTick()", function() {
    it("emits the event on the next tick", function() {

      var args;
      obj.listener1 = function (hello, world) { args = hello + world; }
      spyOn(obj, 'listener1').andCallThrough();

      obj.onSomeEvent(obj.listener1);

      obj.onSomeEvent.emitOnNextTick('hello ', 'world');

      expect(obj.listener1).not.toHaveBeenCalled();

      waits(1);

      runs(function () {
        expect(obj.listener1).toHaveBeenCalled();
        expect(args).toEqual('hello world');
      });
    });

    it('returns undefined', function () {

      expect(obj.onSomeEvent.emitOnNextTick()).toBeUndefined();
    });
  });

  describe('emitWithArgsOnNextTick()', function () {
    it('calls emitOnNextTick() with the specified arguments', function () {
      spyOn(obj.onSomeEvent, 'emitOnNextTick');
      obj.onSomeEvent.emitWithArgsOnNextTick([1,2,3,4]);
      expect(obj.onSomeEvent.emitOnNextTick).toHaveBeenCalledWith(1,2,3,4);
    });

    it('returns undefined', function () {

      expect(obj.onSomeEvent.emitWithArgsOnNextTick()).toBeUndefined();
    })
  });

  describe("hasOccured()", function() {
    it("returns true when the event had been emitted", function() {
      obj.onSomeEvent.emit();
      expect(obj.onSomeEvent.hasOccurred()).toBe(true);
    });

    it("returns false before the event is emitted", function() {
      expect(obj.onSomeEvent.hasOccurred()).toBe(false);
    });
  });

  describe("isSingle()", function() {
    
    it("indicates whether the event is a one time event", function() {
      
      expect(obj.onLoad.isSingle()).toBe(true);
      expect(obj.onSomeEvent.isSingle()).toBe(false);
    });
  });
});