describe('eventify.EventsMixin', function () {

  var obj;

  beforeEach(function () {
    obj = {};
  });

  describe('namespace()', function () {

    it('returns the namespace if the object was eventified with a namespace', function () {
      eventify(obj, 'ns');
      expect(obj.events.namespace()).toBe('ns');
    });

    it('returns undefined if no namespace has been specified', function () {
      eventify(obj);
      expect(obj.events.namespace()).toBeUndefined();
    })
  });

  describe('define()', function () {

    it('creates events on the obj for the passed names', function () {
      
      eventify(obj).define('onClick', 'onClose', 'onWhatever');
      
      ['onClick', 'onClose', 'onWhatever'].forEach(function (event) {
        expect(obj[event]).toBeAnEventifyEvent();
      });
    });

    it('throws an error if a member of the name is already defined (but not an event)', function () {
      
      obj.onExisting = 'hello';

      expect(function () {
        
        eventify(obj).define('onExisting');

      }).toThrow('member already defined: onExisting');
    });

    it('does not throw an error if the event is already defined', function () {
      eventify(obj).define('onWoof');

      expect(function () {
        eventify(obj).define('onWoof')
      }).not.toThrow();
    });

    it('does not redefine an event, but will delcare it as a non-single event', function () {
      
      eventify(obj).define('onDropped').single('onInit');

      var listener = jasmine.createSpy('listener');
      obj.onDropped(listener);
      
      var event       = obj.onDropped
        , singleEvent = obj.onInit;

      obj.events.define('onDropped', 'onInit');

      expect(obj.onDropped).toBe(event);
      expect(obj.onInit).toBe(singleEvent);
      expect(obj.onInit.isSingle()).toBe(false);

      obj.onDropped.emit();

      expect(listener).toHaveBeenCalled();
    });


    it('returns itself', function () {
      eventify(obj);
      expect(obj.events.define('anEvent')).toBe(obj.events);
    });
  });

  describe('single()', function () {

    it('creates single events on the obj for the passed names', function () {
      
      eventify(obj).single('onInit', 'onLoad', 'onReady');
      
      ['onInit', 'onLoad', 'onReady'].forEach(function (event) {
        expect(obj[event]).toBeAFunction();
        expect(obj[event].isSingle()).toBe(true);
      });
    });

    it('throws an error if a member of the name is already defined', function () {
      
      obj.onExisting = 'hello';

      expect(function () {
        
        eventify(obj).single('onExisting');

      }).toThrow('member already defined: onExisting');
    });

    it('does not throw an error if the event is already defined', function () {
      eventify(obj).single('onInit');

      expect(function () {
        obj.events.single('onInit')
      }).not.toThrow();
    });

    it('does not redefine an event, but will delcare it as a single event', function () {
      
      eventify(obj).define('onInit');
      
      var singleEvent = obj.onInit;

      obj.events.single('onInit');

      expect(obj.onInit).toBe(singleEvent);
      expect(obj.onInit.isSingle()).toBe(true);
    });

    it('returns itself', function () {
      eventify(obj);
      expect(obj.events.single('anEvent')).toBe(obj.events);
    });
  });

  describe('names()', function () {
    
    it('returns an array of event names for the object', function () {
      eventify(obj).define('onThis', 'onThat').single('onTheOne');
      expect(obj.events.names()).toEqual(['onThis', 'onThat', 'onTheOne']);
    });

    it ('does not get a type error for null members', function () {
      
      eventify(obj).define('afterClick');

      obj.nil = null;

      expect(function () {
        obj.events.names();
      }).not.toThrow();
    });
  });

  describe('cancelAllSubscriptions()', function () {

    it('removes all listeners for all events', function () {
      
      eventify(obj).define('onDo', 'onDont');

      obj.events.cancelAllSubscriptions();
      
      expect(obj.onDo.subscriptions().count()).toEqual(0);
      expect(obj.onDont.subscriptions().count()).toEqual(0);
    });

    it("leaves all events on the object", function() {
      
      eventify(obj).define('onDo', 'onDont');
      
      obj.events.cancelAllSubscriptions();

      expect(obj.onDo).not.toBeUndefined();
      expect(obj.onDont).not.toBeUndefined();
    });

    it('returns undefined', function () {
      eventify(obj);
      expect(obj.events.cancelAllSubscriptions()).toBeUndefined();
    })
  });

  describe('pipe()', function () {
      
    var source;

    beforeEach(function () {
      source = {};

      eventify(source, 'namespace')
        .define('onSomeEvent', 'onAnotherEvent')
        .single('onInit');

      eventify(obj, 'own-namespace').pipe(source);
    });

    it('throws an error if no source is specified', function () {
      expect(function () {
        obj.events.pipe();
      }).toThrow('the object to pipe events from must be specified');
    });

    it('pipes all events from a source if a source is passed alone', function () {
      var obj = {};
      
      eventify(obj).pipe(source);

      source.events.names().forEach(function (name) {
        expect(obj[name]).toBeAnEventifyEvent();
      });
    });

    it('pipes only events specified from a source if a source is passed along with event names', function () {
      var obj = {};
      
      eventify(obj).pipe(source, 'onSomeEvent', 'onAnotherEvent');

      ['onSomeEvent', 'onAnotherEvent'].forEach(function (name) {
        expect(obj[name]).toBeAnEventifyEvent();
      });
    });

    it('throws an error if an event name is passed which is not an event on the source', function () {
      
      expect(function () {
        obj.events.pipe(source, 'onNoEvent');
      }).toThrow('onNoEvent is not an event');

      source.onNotAnEvent = {};

      expect(function () {
        obj.events.pipe(source, 'onNotAnEvent');
      }).toThrow('onNotAnEvent is not an event')
    });

    it('throws an error if the piped event name already exists but is not an eventify event', function () {
      var obj = {onSomeEvent: 123};

      expect(function () {
        eventify(obj).pipe(source, 'onSomeEvent');
      }).toThrow('already defined but not an event: onSomeEvent');
    });

    it('does not throw an error if the event is already defined on the obj', function () {
      
      var obj = {};
      eventify(obj).define('onSomeEvent');

      expect(function () {
        eventify(obj).pipe(source, 'onSomeEvent');
      }).not.toThrow();
    });

    it('throws an error if an object tries to pipe events from itself', function () {
      expect(function () {
        source.events.pipe(source);
      }).toThrow('an object cannot pipe events from itself');
    });

    it('pipes single events on the source as single events on the obj', function () {
      expect(source.onInit.isSingle()).toBe(true);
      expect(   obj.onInit.isSingle()).toBe(true);
    });

    it('does not redefine the event', function () {
      var obj = {};

      eventify(obj).define('onSomeEvent');

      var objEvent = obj.onSomeEvent;

      eventify(obj).pipe(source, 'onSomeEvent');

      expect(obj.onSomeEvent).toBe(objEvent);
    });

    it('emits the piped event', function () {
      
      var listener = jasmine.createSpy('listener');
      obj.onSomeEvent(listener);
      source.onSomeEvent.emit(1,2,3,4,5);
      expect(listener).toHaveBeenCalledWith(1,2,3,4,5);
    });

    it('emits the event globally under its own namespace', function () {
      
      var globalListener = {
        'own-namespace/onSomeEvent': jasmine.createSpy()
      };

      eventify.listen(globalListener);

      source.onSomeEvent.emit();

      expect(globalListener['own-namespace/onSomeEvent']).toHaveBeenCalled();
    });

    it('remaps piped events to a different name: onThis:onThat', function () {
      
      var source = {}
        , obj    = {};

      eventify(source).define('onThis');
      eventify(obj).pipe(source, 'onThis:onThat');

      expect(obj.onThat).toBeAnEventifyEvent();

      var listener = jasmine.createSpy('listener');
      obj.onThat(listener);

      source.onThis.emit();

      expect(listener).toHaveBeenCalled();
    });

    it('handles pipe names with more than one colon as non-mappings', function () {

      var source = {}
        , obj    = {};

      eventify(source).define('on:two:colons');
      eventify(obj).pipe(source, 'on:two:colons');

      expect(obj['on:two:colons']).toBeAnEventifyEvent();

      var listener = jasmine.createSpy('listener');
      obj['on:two:colons'](listener);

      source['on:two:colons'].emit();

      expect(listener).toHaveBeenCalled();
    });

    it('returns a Subscriptions object which can be used to cancel all subscriptions', function () {
      
      var origin   = {}
        , obj      = {}
        , listener = jasmine.createSpy('listener');

      eventify(origin).define('onClick', 'onMove');
      eventify(obj);
      
      var subscriptions = obj.events.pipe(origin, 'onClick:onOpen', 'onMove');

      obj.onOpen(listener);
      obj.onMove(listener);

      subscriptions.cancelAll();

      origin.onClick.emit();
      origin.onMove.emit();

      expect(listener).not.toHaveBeenCalled();
    });
  });
})