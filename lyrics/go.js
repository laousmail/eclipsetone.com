// eclipsetone.com/lyrics/ forwards to the lyrics tool at lyrics.eclipsetone.com.
// Until that subdomain answers (DNS and its HTTPS certificate), fall back to the
// github.io address, which serves the same app. No change needed here once it's live.
(function () {
  var SUB = 'https://lyrics.eclipsetone.com/';
  var FALLBACK = 'https://laousmail.github.io/Eclipse-Lyrics/';
  var rest = location.search + location.hash;
  var done = false;
  function go(url) {
    if (done) return;
    done = true;
    document.getElementById('go').href = url + rest;
    location.replace(url + rest);
  }
  var probe = new Image();
  probe.onload = function () { go(SUB); };
  probe.onerror = function () { go(FALLBACK); };
  setTimeout(function () { go(FALLBACK); }, 2500);
  probe.src = SUB + 'icons/favicon-32.png?' + Date.now();
})();
