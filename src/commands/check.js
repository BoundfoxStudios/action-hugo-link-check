import * as core from '@actions/core';
import { LinkChecker, LinkEvent } from './link-checker.js';

export const checkCommand = {
  command: 'check',
  describe: 'Scans a Hugo Website for broken links',
  builder: {
    url: {
      required: true,
    },
    failOnBrokenLinks: {
      required: false,
      default: 1,
      type: 'number',
      describe: 'The number of required broken links to fail the action. Set to 0 to deactivate',
    },
    logSkippedLinks: {
      required: false,
      default: false,
      type: 'boolean',
      describe: 'Logs skipped links and sends them to skipped-links output',
    },
    retry: {
      required: false,
      default: true,
      type: 'boolean',
      describe: 'Automatically retry requests that return HTTP 429 responses and include a \'retry-after\' header',
    },
    timeout: {
      required: false,
      default: 5000,
      type: 'number',
      describe: 'Request timeout in ms. Set to 0 for no timeout',
    },
    skip: {
      required: false,
      default: '',
      type: 'string',
      describe: 'List of urls in regexy form to not include in the check',
    },
  },
  handler: async ({
                    url,
                    failOnBrokenLinks,
                    logSkippedLinks,
                    retry,
                    timeout,
                    skip,
                  }) => {
    const linkChecker = new LinkChecker({
      path: url,
      retry,
      timeout,
      linksToSkip: skip.split(/[\s,]+/).filter(x => !!x), // same as in linkinator-cli
    });
    let checkedLinks = 0;

    linkChecker.events$.on(LinkEvent, () => {
      checkedLinks++;

      if (checkedLinks % 100 === 0) {
        core.info(`Checked ${checkedLinks} links so far...`);
      }
    });

    const startTime = Date.now();
    core.info(`Starting to check ${url}`);
    const links = await linkChecker.run();

    const endTime = Date.now();
    const difference = endTime - startTime;
    const elapsedTime = new Date(difference);
    core.info(`Checking ${links.length} links took ${elapsedTime.getMinutes()}.${elapsedTime.getMilliseconds()} minutes`);

    const skippedLinks = links.filter(link => link.state === 'SKIPPED');
    const brokenLinks = links.filter(link => link.state === 'BROKEN');

    possiblyOutputSkippedLinks(skippedLinks, logSkippedLinks);
    outputBrokenLinks(brokenLinks);
    possiblyFailOnBrokenLinks(brokenLinks, failOnBrokenLinks);
  },
};

function logLink(link) {
  core.info(`  ${link.url}${link.parent ? ` (from ${link.parent})` : ''} -- reason: ${link.state}${link.status ? `http status: ${link.status}` : ''}`);
}

function setOutputs(name, links) {
  core.setOutput(`${name}-count`, links.length);
  core.setOutput(name, JSON.stringify(links.map(link => link.url)));
}

function possiblyOutputSkippedLinks(skippedLinks, logSkippedLinks) {
  if (!logSkippedLinks) {
    return;
  }

  core.info(`Skipped Links: ${skippedLinks.length}`);

  if (skippedLinks.length) {
    skippedLinks.forEach(logLink);
  }

  setOutputs('skipped-links', skippedLinks);
}

function outputBrokenLinks(brokenLinks) {
  core.info(`Broken Links: ${brokenLinks.length}`);

  if (brokenLinks.length) {
    brokenLinks.forEach(logLink);
  }

  setOutputs('broken-links', brokenLinks);
}

function possiblyFailOnBrokenLinks(brokenLinks, failOnBrokenLinks) {
  failOnBrokenLinks = +failOnBrokenLinks || 0;

  if (failOnBrokenLinks > 0 && brokenLinks.length && brokenLinks.length >= failOnBrokenLinks) {
    throw new Error(`Failed due to count of broken links of ${brokenLinks.length}. Allowed are only ${failOnBrokenLinks} broken links.`);
  }
}
