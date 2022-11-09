import * as core from '@actions/core';
import { JunkEvent, LinkChecker, LinkEvent } from './link-checker.js';

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
    honorRobotExclusions: {
      required: false,
      default: true,
      type: 'boolean',
      describe: 'Whether to honor or not robots.txt file, if present on the scanned webpage',
    },
    logSkippedLinks: {
      required: false,
      default: false,
      type: 'boolean',
      describe: 'Logs skipped links and sends them to skipped-links output',
    },
    excludedSchemes: {
      required: false,
      default: '',
      describe: 'Comma-separated list of schemes to exclude',
    },
    excludeExternalLinks: {
      required: false,
      default: false,
      type: 'boolean',
      describe: 'Whether to exclude external links or not',
    },
    excludeInternalLinks: {
      required: false,
      default: false,
      type: 'boolean',
      describe: 'Whether to exclude internal links or not',
    },
    excludeLinksToSamePage: {
      required: false,
      default: false,
      type: 'boolean',
      describe: 'Whether to exclude links to the same page or not',
    },
    userAgent: {
      required: false,
      default: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
      type: 'string',
      describe: 'The user-agent to use for making the request',
    },
  },
  handler: async ({
                    url,
                    failOnBrokenLinks,
                    honorRobotExclusions,
                    logSkippedLinks,
                    excludedSchemes,
                    excludeExternalLinks,
                    excludeInternalLinks,
                    excludeLinksToSamePage,
                    userAgent,
                  }) => {
    const linkChecker = new LinkChecker({
      url,
      honorRobotExclusions,
      excludedSchemes: excludedSchemes.split(','),
      excludeExternalLinks,
      excludeInternalLinks,
      excludeLinksToSamePage,
      userAgent,
    });
    let brokenLinks = [];
    let skippedLinks = [];
    let checkedLinks = 0;

    linkChecker.events$.on(LinkEvent, link => {
      checkedLinks++;

      if (link.broken) {
        brokenLinks.push(link);
      }

      if (checkedLinks % 100 === 0) {
        core.info(`Checked ${checkedLinks} links so far...`);
      }
    });

    linkChecker.events$.on(JunkEvent, link => {
      // we don't care about HTML exclusions due to filterLevel 1
      if (link.excluded && link.excludedReason !== 'BLC_HTML') {
        skippedLinks.push(link);
      }
    });

    const startTime = Date.now();
    core.info(`Starting to check ${url}`);
    await linkChecker.run();

    const endTime = Date.now();
    const difference = endTime - startTime;
    const elapsedTime = new Date(difference);
    core.info(`Checking ${checkedLinks} links took ${elapsedTime.getMinutes()}.${elapsedTime.getMilliseconds()} minutes`);

    possiblyOutputSkippedLinks(skippedLinks, logSkippedLinks);
    outputBrokenLinks(brokenLinks);
    possiblyFailOnBrokenLinks(brokenLinks, failOnBrokenLinks);
  },
};

function logLink(link) {
  core.info(`  ${link.url.resolved || link.url.original}${link.base ? ` (from ${link.base.resolved})` : ''} -- reason: ${link.brokenReason || link.excludedReason}`);
}

function setOutputs(name, links) {
  core.setOutput(`${name}-count`, links.length);
  core.setOutput(name, JSON.stringify(links.map(link => link.url.resolved || link.url.original)));
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
