(function () {
  'use strict';

  var feedUrl = 'https://raw.githubusercontent.com/dzstoredzd/dz-store-releases/main/storesoft/stable/latest.json';
  var fallbackUrl = 'https://github.com/dzstoredzd/dz-store-releases/releases/latest';

  window.StoreSoftWindowsDownload = {
    update: async function (link) {
      link.href = fallbackUrl;
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, 8000);
      try {
        var response = await fetch(feedUrl, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) return;
        var feed = await response.json();
        // Use only the public production channel and this repository's EXE assets.
        if (feed.channel !== 'stable' || feed.environment !== 'production' || feed.productionEligible !== true) return;
        if (typeof feed.downloadUrl !== 'string' || !/^https:\/\/github\.com\/dzstoredzd\/dz-store-releases\/releases\/download\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.exe$/.test(feed.downloadUrl)) return;
        link.href = feed.downloadUrl;
      } catch (_) {
        // A failed feed request must not block a saved lead or Android downloads.
      } finally {
        clearTimeout(timeout);
      }
    }
  };
})();
