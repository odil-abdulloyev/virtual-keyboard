/* eslint-disable no-param-reassign */
/* eslint-disable import/extensions */

import * as storage from './storage.js';
import create from './utils/create.js';
import language from './layouts/index.js'; // { en, ru }
import Key from './Key.js';

const main = create('main', '',
  [create('h1', 'title', 'RSS Virtual Keyboard')]);

export default class Keyboard {
  constructor(rowsOrder) {
    this.rowsOrder = rowsOrder;
    this.keysPressed = {};
    this.isCaps = false;
    this.soundOn = false;
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.addEventListener('result', e => {
        const transcript = Array.from(e.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join(' ');

        if (this.output.textContent !== undefined && this.output.textContent !== null) {
          this.output.textContent += transcript;
        }
      });
      this.recognition.addEventListener('end', () => {
        if (this.voiceOn) this.recognition.start();
      });
    } catch (ex) {
      console.log('Speech recognition is not supported in your browser');
    }
    this.voiceOn = false;

    this.specialKeySound = document.createElement('audio');
    this.specialKeySound.setAttribute('src', 'sounds/special.wav');
    this.specialKeySound.playbackRate = 2;
    this.enKeySound = document.createElement('audio');
    this.enKeySound.setAttribute('src', 'sounds/en.wav');
    this.enKeySound.playbackRate = 1;
    this.ruKeySound = document.createElement('audio');
    this.ruKeySound.setAttribute('src', 'sounds/ru.wav');
    this.ruKeySound.playbackRate = 2;
    this.returnKeySound = document.createElement('audio');
    this.returnKeySound.setAttribute('src', 'sounds/enter.wav');
    this.backspaceKeySound = document.createElement('audio');
    this.backspaceKeySound.setAttribute('src', 'sounds/backspace.wav');
    this.shiftKeySound = document.createElement('audio');
    this.shiftKeySound.setAttribute('src', 'sounds/shift.wav');
    this.capslockKeySound = document.createElement('audio');
    this.capslockKeySound.setAttribute('src', 'sounds/capslock.wav');
    document.body.appendChild(this.specialKeySound);
    document.body.appendChild(this.enKeySound);
    document.body.appendChild(this.ruKeySound);
    document.body.appendChild(this.returnKeySound);
    document.body.appendChild(this.backspaceKeySound);
    document.body.appendChild(this.shiftKeySound);
    document.body.appendChild(this.capslockKeySound);
  }

  init(langCode) {
    this.keyBase = language[langCode];
    this.output = create('textarea', 'output', null, main,
      ['placeholder', 'Start type something...'],
      ['rows', 5],
      ['cols', 50],
      ['spellcheck', false],
      ['autocorrect', 'off']);
    this.container = create('div', 'keyboard', null, main, ['language', langCode]);
    document.body.prepend(main);
    return this;
  }

  generateLayout() {
    this.keyButtons = [];
    this.rowsOrder.forEach((row, i) => {
      const rowElement = create('div', 'keyboard__row', null, this.container, ['row', i + 1]);
      rowElement.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;
      row.forEach((code) => {
        const keyObj = this.keyBase.find((key) => key.code === code);
        if (keyObj) {
          const keyButton = new Key(keyObj);
          this.keyButtons.push(keyButton);
          rowElement.appendChild(keyButton.div);
        }
      });
    });

    document.addEventListener('keydown', this.handleEvent);
    document.addEventListener('keyup', this.handleEvent);
    this.container.onmousedown = this.preHandleEvent;
    this.container.onmouseup = this.preHandleEvent;
  }

  preHandleEvent = (e) => {
    e.stopPropagation();
    const keyDiv = e.target.closest('.keyboard__key');
    if (!keyDiv) return;
    const { dataset: { code } } = keyDiv;
    keyDiv.addEventListener('mouseleave', this.resetButtonState);
    this.handleEvent({ code, type: e.type });
    if (this.soundOn) {
      this.playSound(code);
    }
  };

  // Ф-я обработки событий

  handleEvent = (e) => {
    if (e.stopPropagation) e.stopPropagation();
    const { code, type } = e;
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (!keyObj) return;
    this.output.focus();

    // НАЖАТИЕ КНОПКИ
    if (type.match(/keydown|mousedown/)) {
      if (!type.match(/mouse/)) e.preventDefault();

      if (code.match(/Control|Alt|Caps/) && e.repeat) return;

      if (code.match(/Control/)) this.ctrKey = true;
      if (code.match(/Alt/)) this.altKey = true;

      if (code.match(/AltRight/)) {
        if (this.keyBase === language.ru) {
          keyObj.div.textContent = 'en';
          if (this.recognition) this.recognition.lang = 'en-US';
        } else {
          keyObj.div.textContent = 'ru';
          if (this.recognition) this.recognition.lang = 'ru-RU';
        }
        this.switchLanguage();
      }

      keyObj.div.classList.add('active');

      if (code.match(/Caps/) && !this.isCaps) {
        this.isCaps = true;
        this.switchUpperCase(true);
      } else if (code.match(/Caps/) && this.isCaps) {
        this.isCaps = false;
        this.switchUpperCase(false);
        keyObj.div.classList.remove('active');
      }

      if (code.match(/ShiftLeft/) && !this.shiftKey) {
        this.shiftKey = true;
        this.switchUpperCase(true);
        document.querySelectorAll('.sub').forEach(el => el.style.fontSize = '14px');
      } else if (code.match(/ShiftLeft/) && this.shiftKey) {
        this.shiftKey = false;
        this.switchUpperCase(false);
        keyObj.div.classList.remove('active');
      }

      // play sound on keydown/mousedown
      if (this.soundOn) {
        this.playSound(code);
      }

      if (code.match(/Win/) && !this.soundOn) {
        this.soundOn = true;
      } else if (code.match(/Win/) && this.soundOn) {
        this.soundOn = false;
        keyObj.div.classList.remove('active');
      }

      if (code.match(/ControlRight/) && !this.voiceOn) {
        this.voiceOn = true;
        if (this.recognition) this.recognition.start();
      } else if (code.match(/ControlRight/) && this.voiceOn) {
        this.voiceOn = false;
        if (this.recognition) this.recognition.stop();
        keyObj.div.classList.remove('active');
      }

      // Hide keyboard
      if (code.match(/ShiftRight/)) {
        main.style.overflow = 'hidden';
        this.container.classList.remove('show');
        this.container.classList.add('hidden');
      }

      // Show keyboard
      this.output.addEventListener('click', () => {
        this.container.classList.remove('hidden');
        this.container.classList.add('show');
      });

      // Определяем, какой символ мы пишем в консоль (спец или основной)
      if (!this.isCaps) {
        // если не зажат капс, смотрим не зажат ли шифт
        this.printToOutput(keyObj, this.shiftKey ? keyObj.shift : keyObj.small);
      } else if (this.isCaps) {
        // если зажат капс
        if (this.shiftKey) {
          // и при этом зажат шифт - то для кнопки со спецсимволом даем верхний регистр
          this.printToOutput(keyObj, keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
        } else {
          // и при этом НЕ зажат шифт - то для кнопки без спецсивмола даем верхний регистр
          this.printToOutput(keyObj, !keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
        }
      }
      this.keysPressed[keyObj.code] = keyObj;
      // ОТЖАТИЕ КНОПКИ
    } else if (e.type.match(/keyup|mouseup/)) {
      this.resetPressedButtons(code);

      if (!code.match(/Caps|Win|ControlRight|ShiftLeft/)) keyObj.div.classList.remove('active');
    }
  }

  resetButtonState = ({ target: { dataset: { code } } }) => {
    if (code.match(/Control/)) this.ctrKey = false;
    if (code.match(/Alt/)) this.altKey = false;
    this.resetPressedButtons(code);
    this.output.focus();
  }

  resetPressedButtons = (targetCode) => {
    if (!this.keysPressed[targetCode]) return;
    if (!this.isCaps && !this.soundOn && !this.voiceOn && !this.shiftKey) this.keysPressed[targetCode].div.classList.remove('active');
    this.keysPressed[targetCode].div.removeEventListener('mouseleave', this.resetButtonState);
    delete this.keysPressed[targetCode];
  }

  switchUpperCase(isTrue) {
    // Флаг - чтобы понимать, мы поднимаем регистр или опускаем
    if (isTrue) {
      // Мы записывали наши кнопки в keyButtons, теперь можем легко итерироваться по ним
      this.keyButtons.forEach((button) => {
        // Если у кнопки есть спецсивол - мы должны переопределить стили
        if (button.sub) {
          // Если только это не капс, тогда поднимаем у спецсимволов
          if (this.shiftKey) {
            button.sub.classList.add('sub-active');
            button.letter.classList.add('sub-inactive');
          }
        }
        // Не трогаем функциональные кнопки
        // И если капс, и не шифт, и именно наша кнопка без спецсимвола
        if (!button.isFnKey && this.isCaps && !this.shiftKey && !button.sub.innerHTML) {
          // тогда поднимаем регистр основного символа letter
          button.letter.innerHTML = button.shift;
          // Если капс и зажат шифт
        } else if (!button.isFnKey && this.isCaps && this.shiftKey) {
          // тогда опускаем регистр для основного симовла letter
          button.letter.innerHTML = button.small;
          // а если это просто шифт - тогда поднимаем регистр у основного символа
          // только у кнопок, без спецсимвола --- там уже выше отработал код для них
        } else if (!button.isFnKey && !button.sub.innerHTML) {
          button.letter.innerHTML = button.shift;
        }
      });
    } else {
      // опускаем регистр в обратном порядке
      this.keyButtons.forEach((button) => {
        // Не трогаем функциональные кнопки
        // Если есть спецсимвол
        if (button.sub.innerHTML && !button.isFnKey) {
          // то возвращаем в исходное
          button.sub.classList.remove('sub-active');
          button.letter.classList.remove('sub-inactive');
          // если не зажат капс
          if (!this.isCaps) {
            // то просто возвращаем основным символам нижний регистр
            button.letter.innerHTML = button.small;
          } else if (!this.isCaps) {
            // если капс зажат - то возвращаем верхний регистр
            button.letter.innerHTML = button.shift;
          }
          // если это кнопка без спецсимвола (снова не трогаем функциональные)
        } else if (!button.isFnKey) {
          // то если зажат капс
          if (this.isCaps) {
            // возвращаем верхний регистр
            button.letter.innerHTML = button.shift;
          } else {
            // если отжат капс - возвращаем нижний регистр
            button.letter.innerHTML = button.small;
          }
        }
      });
    }
  }

  switchLanguage = () => {
    const langAbbr = Object.keys(language);
    let langIdx = langAbbr.indexOf(this.container.dataset.language);
    this.keyBase = langIdx + 1 < langAbbr.length ? language[langAbbr[langIdx += 1]]
      : language[langAbbr[langIdx -= langIdx]];

    this.container.dataset.language = langAbbr[langIdx];
    storage.set('kbLang', langAbbr[langIdx]);

    this.keyButtons.forEach((button) => {
      const keyObj = this.keyBase.find((key) => key.code === button.code);
      if (!keyObj) return;
      button.shift = keyObj.shift;
      button.small = keyObj.small;
      if (keyObj.shift && keyObj.shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/g)) {
        button.sub.innerHTML = keyObj.shift;
      } else {
        button.sub.innerHTML = '';
      }
      button.letter.innerHTML = keyObj.small;
    });
    if (this.isCaps || this.shiftKey) this.switchUpperCase(true);
  }

  playSound(code) {
    if (code && code.match(/Enter/)) {
      this.returnKeySound.play();
    } else if (code && code.match(/Backspace/)) {
      this.backspaceKeySound.play();
    } else if (code && code.match(/ShiftLeft/)) {
      this.shiftKeySound.play();
    } else if (code && code.match(/Caps/)) {
      this.capslockKeySound.play();
    } else if (code && code.match(/ShiftRight|Tab|Control|Alt|Delete|Win/)) {
      this.specialKeySound.play();
    } else if (this.keyBase === language.en) {
      this.enKeySound.play();
    } else if (this.keyBase === language.ru) {
      this.ruKeySound.play();
    }
  }

  printToOutput(keyObj, symbol) {
    let cursorPos = this.output.selectionStart;
    const left = this.output.value.slice(0, cursorPos);
    const right = this.output.value.slice(cursorPos);
    const textHandlers = {
      Tab: () => {
        this.output.value = `${left}\t${right}`;
        cursorPos += 1;
      },
      ArrowLeft: () => {
        cursorPos = cursorPos - 1 >= 0 ? cursorPos - 1 : 0;
      },
      ArrowRight: () => {
        cursorPos += 1;
      },
      ArrowUp: () => {
        const positionFromLeft = this.output.value.slice(0, cursorPos).match(/(\n).*$(?!\1)/g) || [[1]];
        cursorPos -= positionFromLeft[0].length;
      },
      ArrowDown: () => {
        const positionFromLeft = this.output.value.slice(cursorPos).match(/^.*(\n).*(?!\1)/) || [[1]];
        cursorPos += positionFromLeft[0].length;
      },
      Enter: () => {
        this.output.value = `${left}\n${right}`;
        cursorPos += 1;
      },
      Delete: () => {
        this.output.value = `${left}${right.slice(1)}`;
      },
      Backspace: () => {
        this.output.value = `${left.slice(0, -1)}${right}`;
        cursorPos -= 1;
      },
      Space: () => {
        this.output.value = `${left} ${right}`;
        cursorPos += 1;
      },
    };
    if (textHandlers[keyObj.code]) textHandlers[keyObj.code]();
    else if (!keyObj.isFnKey) {
      cursorPos += 1;
      this.output.value = `${left}${symbol || ''}${right}`;
    }
    this.output.setSelectionRange(cursorPos, cursorPos);
  }
}
