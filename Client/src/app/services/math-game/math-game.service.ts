import { Injectable } from '@angular/core';

export interface MathQuestion {
  num1: number;
  num2: number;
  operator: string;
  opIndex: number;
  result: number;
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
    const offset = Math.floor(Math.random() * 21) - 10;
    let incorrect = correctAnswer + offset;

    if (incorrect === correctAnswer) {
      incorrect += incorrect > 0 ? 1 : -1;
    }

    return Math.max(0, incorrect);
  }
}
