function debugIntervals () {

  var obj = {};

  eventify(obj).define('onSomeEvent');

  obj.onSomeEvent().withInterval(1000, function (i) {
    console.warn('call ' + i);
  });

  for (var i = 0; i < 100; i++) {
    obj.onSomeEvent().emit(i);
  }
}