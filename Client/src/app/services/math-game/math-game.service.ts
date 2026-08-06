import { Injectable } from '@angular/core';

export interface MathQuestion {
  num1: number;
  num2: number;
  operator: string;
  opIndex: number;
  result: number;
  expression?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MathGameService {
  /**
   * Generates a math question using the provided numbers and a randomly selected operator.
   * Handles division validation: ensures no divide-by-zero, no remainder,
   * and swaps operands if needed so the result is a non-negative integer.
   *
   * @param num1 First operand
   * @param num2 Second operand
   * @param opIndex Operator index (0=+, 1=-, 2=*, 3=/)
   * @returns A MathQuestion with potentially adjusted num1/num2 for division
   */
  generateQuestion(
    num1: number,
    num2: number,
    opIndex: number
  ): MathQuestion {
    const operator = this.getOperatorSymbol(opIndex);
    let result: number;

    switch (opIndex) {
      case 0:
        result = num1 + num2;
        break;
      case 1:
        result = num1 - num2;
        break;
      case 2:
        result = num1 * num2;
        break;
      case 3:
        if (num2 !== 0 && num1 !== 0) {
          if (num1 < num2) {
            [num1, num2] = [num2, num1];
          }
          result = num1 / num2;
        } else {
          result = 0;
        }
        break;
      default:
        result = 0;
        break;
    }

    return { num1, num2, operator, opIndex, result };
  }

  /**
   * Generates an array of 4 answer options: 1 correct + 3 plausible incorrect answers.
   * Incorrect answers are close to the correct value, never negative, and never duplicate.
   *
   * @param correctAnswer The correct answer to include in the options
   * @returns Shuffled array of 4 numbers
   */
  generateOptions(correctAnswer: number): number[] {
    const options: number[] = [correctAnswer];

    while (options.length < 4) {
      const incorrectAnswer = this.generateIncorrectAnswer(correctAnswer);
      if (!options.includes(incorrectAnswer)) {
        options.push(incorrectAnswer);
      }
    }

    this.shuffleArray(options);
    return options;
  }

  /**
   * Perguntas progressivas para desafios competitivos. Evita frações e resultados
   * negativos, aumenta os operandos e introduz expressões de três termos no fim.
   */
  generateProgressiveQuestion(points: number): MathQuestion {
    const inteiro = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const simples = (opIndex: number, min: number, max: number): MathQuestion => {
      let num1 = inteiro(min, max);
      let num2 = inteiro(min, max);
      if (opIndex === 1 && num2 > num1) [num1, num2] = [num2, num1];
      if (opIndex === 3) {
        const divisor = inteiro(Math.max(2, min), Math.max(3, Math.min(max, 15)));
        const quociente = inteiro(2, Math.max(4, Math.floor(max / 2)));
        num1 = divisor * quociente;
        num2 = divisor;
      }
      const pergunta = this.generateQuestion(num1, num2, opIndex);
      return { ...pergunta, expression: `${pergunta.num1} ${pergunta.operator} ${pergunta.num2}` };
    };
    const multiplicacao = (minA: number, maxA: number, minB: number, maxB: number): MathQuestion => {
      const num1 = inteiro(minA, maxA);
      const num2 = inteiro(minB, maxB);
      return { num1, num2, operator: '×', opIndex: 2, result: num1 * num2, expression: `${num1} × ${num2}` };
    };
    const tresTermosSomaSubtracao = (min: number, max: number): MathQuestion => {
      const a = inteiro(min, max), b = inteiro(min, max), c = inteiro(min, Math.max(min + 1, Math.floor(max * .7)));
      const result = a + b - c;
      if (result < 0) return tresTermosSomaSubtracao(min, max);
      return { num1: a, num2: b, operator: '+', opIndex: 0, result, expression: `${a} + ${b} − ${c}` };
    };

    if (points < 6) return simples(Math.random() < 0.55 ? 0 : 1, 2, 12);
    // Early game: tabuada leve. Nunca dois fatores de dois dígitos.
    if (points < 15) return Math.random() < .6
      ? simples(Math.random() < .5 ? 0 : 1, 6, 28)
      : multiplicacao(2, 6, 2, 10);
    // Mid game: cálculo mental com três termos e tabuada mais exigente.
    if (points < 30) {
      const escolha = inteiro(0, 3);
      if (escolha === 0) return tresTermosSomaSubtracao(10, 45);
      if (escolha === 1) return multiplicacao(3, 9, 3, 12);
      return simples(escolha === 2 ? 3 : 0, 6, 35);
    }
    if (points < 50) {
      const a = inteiro(3, 12), b = inteiro(3, 15), c = inteiro(5, 40);
      const soma = Math.random() < 0.5;
      const result = soma ? a * b + c : a * b - c;
      if (result < 0) return simples(2, 8, 25);
      return { num1: a, num2: b, operator: '×', opIndex: 2, result, expression: `${a} × ${b} ${soma ? '+' : '−'} ${c}` };
    }
    // Dois fatores de dois dígitos só entram no late game.
    if (points >= 70 && Math.random() < .45) return multiplicacao(12, 35, 11, 30);
    const divisor = inteiro(2, 15), quociente = inteiro(5, 25), ajuste = inteiro(10, 60);
    const soma = Math.random() < 0.5;
    const result = soma ? quociente + ajuste : Math.max(0, quociente - ajuste);
    if (result === 0 && !soma) return this.generateProgressiveQuestion(35);
    return { num1: divisor * quociente, num2: divisor, operator: '÷', opIndex: 3, result, expression: `${divisor * quociente} ÷ ${divisor} ${soma ? '+' : '−'} ${ajuste}` };
  }

  /**
   * Fisher-Yates shuffle algorithm - shuffles array in place.
   *
   * @param array The array to shuffle
   */
  shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Returns the string symbol for an operator index.
   *
   * @param opIndex 0=+, 1=-, 2=*, 3=/
   * @returns The operator symbol string
   */
  getOperatorSymbol(opIndex: number): string {
    switch (opIndex) {
      case 0:
        return '+';
      case 1:
        return '-';
      case 2:
        return '*';
      case 3:
        return '/';
      default:
        return 'error';
    }
  }

  /**
   * Generates a plausible incorrect answer near the correct answer.
   * The result is never negative and never equal to the correct answer.
   */
  private generateIncorrectAnswer(correctAnswer: number): number {
    // Distratores acompanham a escala da resposta. Para valores grandes, +-10
    // era óbvio; para valores pequenos, o salto continua suficientemente próximo.
    const amplitude = Math.max(4, Math.min(50, Math.round(Math.abs(correctAnswer) * 0.18)));
    if (correctAnswer === 0) return Math.floor(Math.random() * amplitude) + 1;
    const offset = Math.floor(Math.random() * (amplitude * 2 + 1)) - amplitude;
    let incorrect = correctAnswer + offset;

    if (incorrect === correctAnswer) {
      incorrect += incorrect > 0 ? 1 : -1;
    }

    return Math.max(0, incorrect);
  }
}
