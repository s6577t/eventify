// Global functions
function queryParameter (name) {
  
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regex_str = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp(regex_str);
  
  var results = regex.exec( window.location.href );
  
  if( results == null )
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function uuid () {
	// from: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
	// http://www.ietf.org/rfc/rfc4122.txt
	var s = [];
	var hexDigits = "0123456789ABCDEF";
	for (var i = 0; i < 32; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	s[12] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
	s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01

	var uuid = s.join("");
	return uuid;
}

function using (obj, f) {
  return f.call(obj, obj);
}

function extend (object, overwrite) {
  
  object = object || {};
  
  return {
    with: function () {
      
      toArray(arguments).forEach(function(other) {
        for (var member in other) {
          if (overwrite || (typeof object[member] === 'undefined')) {
            object[member] = other[member];
          }           
        }
      });
      
      return object;
    }
  };
}

function overwrite (object) {
  return extend(object, true);
}

// for use with option enabled methods
function defaultsFor (options, defaults) {
  return extend(options).with(defaults);
} 

function proxyFunction(context, phunction) {
  return function () {
    return phunction.apply(context, arguments);
  };
}

function toArray (object) {
  return Array.prototype.slice.call(object);
};

function NotImplemented () {
  throw new Exception("Not Implemented");
}

function TODO (thing) {
  console.warn("TODO" + thing ? (": " + thing) : '');
}