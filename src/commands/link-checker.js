import { EventEmitter } from 'node:events';
import blc from 'broken-link-checker';

export const LinkEvent = Symbol('link');
export const JunkEvent = Symbol('junk');
export const EndEvent = Symbol('end');

export class LinkChecker {
  events$ = new EventEmitter();
  #url;
  #siteChecker;

  constructor(options) {
    const defaultOptions = {
      maxSocketsPerHost: 20
    }

    options = Object.assign({}, defaultOptions, options);

    this.#url = options.url;

    this.#siteChecker = new blc.SiteChecker(options, {
      link: (result) => this.events$.emit(LinkEvent, result),
      junk: (result) => this.events$.emit(JunkEvent, result),
      end: () => this.events$.emit(EndEvent),
    });
  }

  run() {
    return new Promise(resolve => {
      this.events$.once(EndEvent, () => resolve());
      this.#siteChecker.enqueue(this.#url);
    });
  }
}
