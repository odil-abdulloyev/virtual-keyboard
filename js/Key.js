/* eslint-disable import/extensions */
import create from './utils/create.js';

export default class Key {
  constructor({ small, shift, code }) {
    this.code = code;
    this.small = small;
    this.shift = shift;
    this.isFnKey = Boolean(small.match(/Ctrl|arr|Alt|&#8679;|&#8677;|Back|&#8998;|&#9166;|&#10003;|&#8682;|&#128266;|ru|en|&#127897;|&#9003;/));

    if (shift && shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/)) {
      this.sub = create('div', 'sub', this.shift);
    } else {
      this.sub = create('div', 'sub', '');
    }

    this.letter = create('div', 'letter', small);
    this.div = create('div', 'keyboard__key', [this.sub, this.letter], null, ['code', this.code],
      this.isFnKey ? ['fn', 'true'] : ['fn', 'false']); // мы забыли этот атрибут добавить )) он нужен, чтобы в разметке стилизовать функциональные клавиши отдельно
  }
}
