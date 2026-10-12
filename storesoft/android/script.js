(function () {
  'use strict';
  var target = '/storesoft/v1/android/' + window.location.search + window.location.hash;
  var fallback = document.getElementById('androidRedirect');
  if (fallback) fallback.href = target;
  window.location.replace(target);
}());
