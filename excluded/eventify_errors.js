eventify.throwError = function (errorOrMessage) {
  var error = (typeof errorOrMessage === 'string') ? new Error(errorOrMessage) : errorOrMessage;
  error.isEventifyError = true;
  throw error;
}