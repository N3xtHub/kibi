import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const retry = getService('retry');
  const log = getService('log');
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const PageObjects = getPageObjects(['common', 'discover', 'header']);

  describe('shared links', function describeIndexTests() {
    let baseUrl;
    // The message changes for Firefox < 41 and Firefox >= 41
    // var expectedToastMessage = 'Share search: URL selected. Press Ctrl+C to copy.';
    // var expectedToastMessage = 'Share search: URL copied to clipboard.';
    // Pass either one.
    const expectedToastMessage = /Share search: URL (selected\. Press Ctrl\+C to copy\.|copied to clipboard\.)/;

    before(function () {
      baseUrl = PageObjects.common.getHostPort();
      log.debug('baseUrl = ' + baseUrl);
      // browsers don't show the ':port' if it's 80 or 443 so we have to
      // remove that part so we can get a match in the tests.
      baseUrl = baseUrl.replace(':80','').replace(':443','');
      log.debug('New baseUrl = ' + baseUrl);

      const fromTime = '2015-09-19 06:31:44.000';
      const toTime = '2015-09-23 18:31:44.000';

      // delete .kibana index and update configDoc
      return kibanaServer.uiSettings.replace({
        'dateFormat:tz': 'UTC',
        'defaultIndex': 'logstash-*'
      })
      .then(function loadkibanaIndexPattern() {
        log.debug('load kibana index with default index pattern');
        return esArchiver.load('discover');
      })
      // and load a set of makelogs data
      .then(function loadIfEmptyMakelogs() {
        return esArchiver.loadIfNeeded('logstash_functional');
      })
      .then(function () {
        log.debug('discover');
        return PageObjects.common.navigateToApp('discover');
      })
      .then(function () {
        log.debug('setAbsoluteRange');
        return PageObjects.header.setAbsoluteRange(fromTime, toTime);
      })
      .then(function () {
        //After hiding the time picker, we need to wait for
        //the refresh button to hide before clicking the share button
        return PageObjects.common.sleep(1000);
      });
    });

    describe('shared link', function () {
      it('should show "Share a link" caption', function () {
        const expectedCaption = 'Share saved';
        return PageObjects.discover.clickShare()
        .then(function () {
          PageObjects.common.saveScreenshot('Discover-share-link');
          return PageObjects.discover.getShareCaption();
        })
        .then(function (actualCaption) {
          expect(actualCaption).to.contain(expectedCaption);
        })
        // kibi: hide share panel
        .then(() => PageObjects.discover.clickShare());
        // kibi: end
      });

      it('should show the correct formatted URL', async function () {
        // kibi: the URL is always shortened
        const re = new RegExp(baseUrl + '/goto/[0-9a-f]{32}$');
        return PageObjects.discover.clickShare()
        .then(() => PageObjects.header.waitUntilLoadingHasFinished())
        // kibi: end
        .then(() => {
          return PageObjects.discover.getSharedUrl()
          .then(function (actualUrl) {
            expect(actualUrl).to.match(re);
          });
        })
        // kibi: hide share panel
        .then(() => PageObjects.discover.clickShare());
        // kibi: end
      });

      it('should show toast message for copy to clipboard', function () {
        // kibi: open share panel
        return PageObjects.discover.clickShare()
        .then(() => PageObjects.header.waitUntilLoadingHasFinished())
        .then(() => PageObjects.discover.clickCopyToClipboard())
        // kibi: end
        .then(function () {
          return PageObjects.header.getToastMessage();
        })
        .then(function (toastMessage) {
          PageObjects.common.saveScreenshot('Discover-copy-to-clipboard-toast');
          expect(toastMessage).to.match(expectedToastMessage);
        })
        .then(function () {
          return PageObjects.header.waitForToastMessageGone();
        })
        // kibi: hide share panel
        .then(() => PageObjects.discover.clickShare());
        // kibi: end
      });

      // kibi: removed test "shorten URL button should produce a short URL"
      // as we removed the button

      it('should show toast message for copy to clipboard', function () {
        // kibi: open share panel
        return PageObjects.discover.clickShare()
        .then(() => PageObjects.header.waitUntilLoadingHasFinished())
        // kibi: end
        .then(() => PageObjects.discover.clickCopyToClipboard())
        .then(function () {
          return PageObjects.header.getToastMessage();
        })
        .then(function (toastMessage) {
          expect(toastMessage).to.match(expectedToastMessage);
        })
        .then(function () {
          return PageObjects.header.waitForToastMessageGone();
        })
        // kibi: hide share panel
        .then(() => PageObjects.discover.clickShare());
        // kibi: end
      });
    });
  });
}
