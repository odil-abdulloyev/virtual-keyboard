class Calculator {
  constructor(previousOperandTextElement, currentOperandTextElement) {
    this.previousOperandTextElement = previousOperandTextElement;
    this.currentOperandTextElement = currentOperandTextElement;
    this.readyToReset = false;
    this.clear();
  }

  clear() {
    this.currentOperand = '';
    this.previousOperand = '';
    this.operation = undefined;
  }

  delete() {
    this.currentOperand = this.currentOperand.toString().slice(0, -1);
  }

  appendNumber(number) {
    if (number === '.' && this.currentOperand.includes('.')) return;
    this.currentOperand = this.currentOperand.toString() + number.toString();
  }

  chooseOperation(operation) {
    if (this.currentOperand === '') {
      if (operation === '-') {
        this.currentOperand = '-';
      }
      return;
    } else if (this.currentOperand === '-' && operation === '-') {
      return;
    }
    if (this.previousOperand !== '' && this.previousOperand !== '') {
      this.compute();
    }
    this.operation = operation;
    this.previousOperand = this.currentOperand;
    this.currentOperand = '';
  }

  compute() {
    let computation;
    const prev = parseFloat(this.previousOperand);
    const current = parseFloat(this.currentOperand);
    if ((isNaN(prev) || isNaN(current)) && this.operation !== '√') {
      return;
    }
    switch (this.operation) {
      case '+':
        computation = prev + current;
        break
      case '-':
        computation = prev - current;
        break
      case '*':
        computation = prev * current;
        break
      case '÷':
        computation = prev / current;
        break
      case 'xy':
        computation = Math.pow(prev, current);
        break;
      case '√':
        if (prev < 0) {
          throw 'complex';
        }
        computation = Math.sqrt(prev);
        break;
      default:
        return;
    }
    computation = Math.round(computation * Math.pow(10, 12)) / Math.pow(10, 12);
    this.currentOperand = computation;
    this.operation = undefined;
    this.previousOperand = '';
    this.readyToReset = true;
  }

  getDisplayNumber(number) {
    if (number === '-') {
      return '-';
    }
    const stringNumber = number.toString()
    const integerDigits = parseFloat(stringNumber.split('.')[0])
    const decimalDigits = stringNumber.split('.')[1]
    let integerDisplay
    if (isNaN(integerDigits)) {
      integerDisplay = ''
    } else {
      integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 })
    }
    if (decimalDigits != null) {
      return `${integerDisplay}.${decimalDigits}`
    } else {
      return integerDisplay
    }
  }

  updateDisplay() {
    this.currentOperandTextElement.innerText =
      this.getDisplayNumber(this.currentOperand)
    if (this.operation != null) {
      let oper = this.operation;
      if (oper === 'xy') {
        oper = '^';
      }
      if (oper === '√') {
        this.previousOperandTextElement.innerText =
          `${oper} ${this.getDisplayNumber(this.previousOperand)}`;
      } else {
        this.previousOperandTextElement.innerText =
          `${this.getDisplayNumber(this.previousOperand)} ${oper}`;
      }
    } else {
      this.previousOperandTextElement.innerText = ''
    }
  }
}


const numberButtons = document.querySelectorAll('[data-number]');
const operationButtons = document.querySelectorAll('[data-operation]');
const equalsButton = document.querySelector('[data-equals]');
const deleteButton = document.querySelector('[data-delete]');
const allClearButton = document.querySelector('[data-all-clear]');
const previousOperandTextElement = document.querySelector('[data-previous-operand]');
const currentOperandTextElement = document.querySelector('[data-current-operand]');

const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement)

numberButtons.forEach(button => {
  button.addEventListener("click", () => {

    if (calculator.previousOperand === "" &&
      calculator.currentOperand !== "" &&
      calculator.currentOperand !== '-' &&
      calculator.readyToReset) {
      calculator.currentOperand = "";
    }
    calculator.appendNumber(button.innerText);
    calculator.updateDisplay();
    calculator.readyToReset = false;
  })
})

operationButtons.forEach(button => {
  button.addEventListener('click', () => {
    calculator.chooseOperation(button.innerText);
    calculator.updateDisplay();
  })
})

equalsButton.addEventListener('click', button => {
  try {
    calculator.compute();
    calculator.updateDisplay();
  } catch (msg) {
    calculator.previousOperandTextElement.innerText = '';
    calculator.currentOperandTextElement.innerText = msg;
    calculator.operation = undefined;
  }

})

allClearButton.addEventListener('click', button => {
  calculator.clear();
  calculator.updateDisplay();
})

deleteButton.addEventListener('click', button => {
  calculator.delete();
  calculator.updateDisplay();
})