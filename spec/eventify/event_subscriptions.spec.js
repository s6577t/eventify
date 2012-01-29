describe("eventify.EventSubscriptions", function() {

  var object, subscriberCount;

  beforeEach(function () {
    
    object          = {};
    subscriberCount = 0;
    
    eventify(object, function () {
      this.define('onSomeEvent');
    });

    while (subscriberCount++ < 3) {
      object.onSomeEvent(function () {});
    }
  });

  describe("#forEach()", function() {
    it("provides iteration of the EventSubscriptions", function() {

      object.onSomeEvent(function () {});
      object.onSomeEvent().subscriptions().forEach(function (s) {
        expect(s).toBeInstanceOf(eventify.EventSubscription);
      });
    });
  });

  describe("#toArray()", function() {
    it("returns an array which is a copy of the internal storage", function() {

      var subscriptions = object.onSomeEvent().subscriptions();
      expect(subscriptions.toArray()).not.toBe(subscriptions._subscriptions)
    });
  });

  describe("#count()", function() {
    it("returns the number of subscriptions", function() {

      expect(object.onSomeEvent().subscriptions().count()).toBe(3);

      object.onSomeEvent(function () {});
      object.onSomeEvent(function () {});
      object.onSomeEvent(function () {});

      expect(object.onSomeEvent().subscriptions().count()).toBe(6);
    });
  });

  describe("#cancelAll()", function() {
    
    it("causes all subscriptions to become inactive", function() {
      expect(object.onSomeEvent().subscriptions().count() > 0).toBe(true);
      
      object.onSomeEvent().subscriptions().cancelAll();
      
      object.onSomeEvent().subscriptions().forEach(function (subscription) {
        expect(subscription.isActive()).toBe(false);
      });
    });

    it('causes listeners to no longer be called', function () {

      object.listener1 = function () {};
      object.listener2 = function () {};
      object.listener3 = function () {};

      spyOn(object, 'listener1');
      spyOn(object, 'listener2');
      spyOn(object, 'listener3');

      object.onSomeEvent(object.listener1);
      object.onSomeEvent(object.listener2);
      object.onSomeEvent(object.listener3);
      object.onSomeEvent().subscriptions().cancelAll();
      object.onSomeEvent().emit();

      expect(object.listener1).not.toHaveBeenCalled();
      expect(object.listener2).not.toHaveBeenCalled();
      expect(object.listener3).not.toHaveBeenCalled();
    });
  });

});