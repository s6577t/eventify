beforeEach(function() {
  this.addMatchers({
    toThrowATaggedError: function () {
      var error = null;

      try {
        this.actual();
      } catch (e) {
        error = e;
      }

      if (error instanceof Error) {
        return error.isEventifyError;
      } else {
        this.message = 'an error was not thrown';
      }

      return false;
    }
  });
});