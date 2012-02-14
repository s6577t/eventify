describe("eventify", function() {

  var object;

  beforeEach(function () {
    object = {};
    eventify(object, function () {
      this.define('onSomeEvent');
      this.define('onSomeOtherEvent');
    });
  });

  describe("eventify()ing an object", function() {

    describe('defining events', function () {
      it("should allow events to be defined in a configuration function", function() {

        eventify(object, function () {
          this.define('onBoo');
          this.define('onMangle');
          this.define('onWhatever');
        });

        expect(object['onMangle']()).toBeInstanceOf(eventify.Event);
        expect(object['onBoo']()).toBeInstanceOf(eventify.Event);
        expect(object['onWhatever']()).toBeInstanceOf(eventify.Event);
      });

      it("should allow an event to be defined as a one time event", function() {
        eventify(object, function () {
          this.define('onDrag', { oneTimeEvent: true });
        });
        expect(object.onDrag()._oneTimeEvent).toBe(true);
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

      it("allows a global event namespace to be defined", function() {

        eventify(object, 'my-namespace', function () {
          this.define('onSomeEvent');
        });

        expect(object.onSomeEvent().namespace()).toBe('my-namespace');
      });

      it("allows different events on the same eventified objects to have difference namespaces", function() {
        eventify(object, 'my-namespace', function () {
          this.define('onSomeEvent');
        });

        expect(object.onSomeEvent().namespace()).toBe('my-namespace');

        eventify(object, 'my-other-namespace', function () {
          this.define('onSomeOtherEvent');
        });

        expect(object.onSomeOtherEvent().namespace()).toBe('my-other-namespace');
      });

      it("allows namespace to have slashes", function () {
        eventify(object, 'in/a/slash', function () {
          this.define('anEvent');
        })
        expect(object.anEvent().namespace()).toBe('in/a/slash');
      });
    })
    
    describe('propogating events', function () {
      
      var source, propogator;

      beforeEach(function () {
        source = object;
        propagated = {};

        eventify(propagated, function () {
          this.propagate(source.onSomeEvent);
        });

        eventify(propagated, 'in-a-namespace', function () {
          this.propagate(source.onSomeOtherEvent);
        });
      });

      it('defines an event of the same name as the propagated event but in a potentially different namespace on the eventified object', function () {
        expect(propagated.onSomeOtherEvent().namespace()).toBe('in-a-namespace');
      });

      it('emits the propagated event', function () {
        
        var listener = jasmine.createSpy('listener');
        propagated.onSomeEvent(listener);
        source.onSomeEvent().emit();
        expect(listener).toHaveBeenCalled();
      });

      it('removes cancels the subscription to the original event when a propagated event subscription is cancelled', function () {
        
        var subs = propagated.onSomeEvent(function () {});
        
        var originalSourceListenerCount = source.onSomeEvent().subscriptions().count();

        subs.cancel();

        expect(source.onSomeEvent().subscriptions().count()).toBe(originalSourceListenerCount - 1);
      });

      it('can be passed an eventify.Event or a function with a _returnsAnEventifyEvent member', function () {
        
        eventify(source, function () {
          this.define('onWithEvent');
          this.define('onWithFunction');
        });

        eventify(propagated, function () {
          this.propagate(source.onWithEvent());
          this.propagate(source.onWithFunction);
        });

        expect(propagated.onWithEvent()).toBeInstanceOf(eventify.Event);
        expect(propagated.onWithFunction()).toBeInstanceOf(eventify.Event);
      })
    })
  });

  describe("members of the eventified object defined through eventify", function() {

    it("return an event subscription when passing a handler", function () {
      expect(object.onSomeEvent(function () {})).toBeInstanceOf(eventify.EventSubscription);
    });

    describe("passing an event listener", function() {

      it("returns the eventify.Event when not passing a function to the event", function () {

        eventify(object, function () {
          this.define('onSomeEvent')
        });

        expect(object.onSomeEvent('string')).toBeInstanceOf(eventify.Event);
        expect(object.onSomeEvent({})).toBeInstanceOf(eventify.Event);
        expect(object.onSomeEvent([])).toBeInstanceOf(eventify.Event);
        expect(object.onSomeEvent(12345)).toBeInstanceOf(eventify.Event);
        expect(object.onSomeEvent(true)).toBeInstanceOf(eventify.Event);
        expect(object.onSomeEvent(false)).toBeInstanceOf(eventify.Event);
      })
    });
  });

  describe('.cancelAllSubscriptionsOn()', function () {

    it ('should not get a type error for null members', function () {
      object.nil = null;

      expect(function () {
        eventify.cancelAllSubscriptionsOn(object);
      }).not.toThrow();
    });

    it('should remove all listeners for events installed by events', function () {
      eventify(object, function () {
        this.define('onDo');
        this.define('onDont');
      });
      eventify.cancelAllSubscriptionsOn(object);
      expect(object.onDo().subscriptions().count()).toEqual(0);
      expect(object.onDont().subscriptions().count()).toEqual(0);
    });

    it("should leave all events on the object", function() {
      eventify(object, function () {
        this.define('onDo');
        this.define('onDont');
      });
      eventify.cancelAllSubscriptionsOn(object);
      expect(object.onDo).not.toBeUndefined();
      expect(object.onDont).not.toBeUndefined();
    });

    it('should return the deventified object', function () {
      expect(eventify.cancelAllSubscriptionsOn(object)).toBe(object);
    })
  });

  describe('.listen()', function () {

    it("returns an EventSubscription", function() {
      var subs = eventify.listen('./onSomeEvent', function () {});
      expect(subs).toBeInstanceOf(eventify.EventSubscription);
    });

    it("throws an error if I try to listen to an event without a slash such as 'anEvent'", function() {
      expect(function () {
        eventify.listen('anEvent', function () {});
      }).toThrow();
    });

    describe("EventSubscription objects returned by global event listening", function () {

      beforeEach(function () {

        object.listener         = function () {};

        eventify(object, 'specs', function () {
          this.define('onSomeOccurrence');
        });
      })

      describe("#isActive()", function() {
        it("correctly indicates whether the subscription is active", function () {
          var subscription = eventify.listen('alert/beforeSheGetsHome', function () {});
          expect(subscription.isActive()).toBe(true);
          subscription.cancel();
          expect(subscription.isActive()).toBe(false);
        })
      });

      describe("#cancel()", function() {

        describe("catch all subscriptions", function() {
          it("results in the listener no longer being called", function() {

            var listener = jasmine.createSpy();

            var subs = eventify.listen(listener);

            subs.cancel();

            object.onSomeEvent().emit();

            expect(listener).not.toHaveBeenCalled();
          });
        });

        describe('named subscriptions', function () {
          it("results in the listener no longer being called", function() {

            var listener = jasmine.createSpy();

            var subs = eventify.listen('specs/onSomeOccurence', listener);

            subs.cancel();

            object.onSomeEvent().emit();

            expect(listener).not.toHaveBeenCalled();
          });
        });
      });
    });

    describe('globally subscribing to a one time event', function () {

      beforeEach(function () {
        eventify(object, 'global-onetime', function () {
          this.define('whenItHappens', { oneTimeEvent: true });
        });
      });

      it("should call the event normally the first time the event occurs", function() {

        var listener = jasmine.createSpy();
        eventify.listen('global-onetime/whenItHappens', listener);

        object.whenItHappens().emit();

        expect(listener).toHaveBeenCalled();
      });

      describe("when the event has occured", function() {

        it("causes existing subscribers to become inactive", function() {

          var subs = eventify.listen('global-onetime/whenItHappens', function () {});

          object.whenItHappens().emit();

          expect(subs.isActive()).toBe(false);
        });

        it("calls new subscribers on the next tick and returns inactivates the subscription", function() {

          var listener = jasmine.createSpy();

          object.whenItHappens().emit();

          var subscription = eventify.listen('global-onetime/whenItHappens', listener);

          expect(listener).not.toHaveBeenCalled();
          expect(subscription.isActive()).toBe(false);

          waits(1);

          runs(function () {
            expect(listener).toHaveBeenCalled();
            expect(subscription.isActive()).toBe(false);
          });
        });
      });
    })
  })

  describe('._emit()', function () {

    it("calls listeners in the context of the source", function() {

      var context, listener = function () {
        context = this;
      }

      eventify.listen('./onSomeEvent', listener);

      eventify._emit(object.onSomeEvent());

      expect(context).toBe(object);
    });

    it('passes the arguments along to the listeners', function () {

      var args, listener = function () {
        args = arguments;
      }

      eventify.listen('./onSomeEvent', listener);

      eventify._emit(object.onSomeEvent(), ['hello', 12345, true]);

      expect(args).toEqual(['hello', 12345, true]);
    });

    it("calls catchall event listeners with a single parameter { namespace: ..., eventName: ..., args: ... }", function () {

      var arg;
      var listener = jasmine.createSpy().andCallFake(function (a) {
        arg = a;
      });
      
      eventify(object, 'in-a-namespace', function () {
        this.define('onSomeOtherEvent');
      });
      
      eventify.listen(listener);

      eventify._emit(object.onSomeOtherEvent(), [1,2,3,4]);

      expect(listener).toHaveBeenCalled();
      expect(arg.args).toEqual([1,2,3,4]);
      expect(arg.namespace).toEqual('in-a-namespace');
      expect(arg.eventName).toEqual('onSomeOtherEvent');

      // spec again with an unnamespaced event

      object.listener = function (a) {
        arg = a;
      }

      spyOn(object, 'listener').andCallThrough();

      eventify.listen(object.listener);

      eventify._emit(object.onSomeEvent(), ['hello']);

      expect(object.listener).toHaveBeenCalled();
      expect(arg.args).toEqual(['hello']);
      expect(arg.namespace).toEqual('.');
      expect(arg.eventName).toEqual('onSomeEvent');

    });

    it("calls global listeners in the context of the source object", function () {
      var context, src = {};

      eventify.listen(function () {
        context = this;
      });

      eventify._emit(object.onSomeEvent());

      expect(context).toBe(object);
    })
  });
});
