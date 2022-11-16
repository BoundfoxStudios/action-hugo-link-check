import { EventEmitter } from 'node:events';
import { LinkChecker as Linkinator } from 'linkinator';

export const LinkEvent = Symbol('link');

export class LinkChecker {
  events$ = new EventEmitter();
  #options;
  #siteChecker;

  constructor(options) {
    this.#options = options;
    this.#siteChecker = new Linkinator();

    this.#siteChecker.on('link', link => this.events$.emit(LinkEvent, link));
  }

  async run() {
    const result = await this.#siteChecker.check({...this.#options, recurse: true });

    return result.links;
  }
}
