/* eslint-disable no-underscore-dangle */
import winston from 'winston';
import prettyMs from 'pretty-ms';
import TransportStream from 'winston-transport';
import ProgressBar from 'progress';
import chalkTemplate from 'chalk-template';

const cliStringConsole = chalkTemplate`{bold.keyword("orange") kickstartDS}`;

export default class ProgressBarTransport extends TransportStream {
  private step: number;

  private numSteps: number;

  private command: string;

  private subcommand: string;

  private formatConsole: (info: winston.Logform.TransformableInfo) => string;

  private timings: Timing[];

  private summedTimings: number;

  private elapsed: number;

  private progressBar: ProgressBar;

  private startTime: number;

  private elapsedTime: number;

  private cumulatedElapsedTime: number;

  private interval: NodeJS.Timeout;

  constructor(
    opts: TransportStream.TransportStreamOptions & {
      formatConsole(info: winston.Logform.TransformableInfo): string;
      timings: Timing[];
    }
  ) {
    super(opts);

    this.formatConsole = opts.formatConsole;
    this.timings = opts.timings;

    this.step = 1;
    this.numSteps = 1;
    this.command = '';
    this.subcommand = '';

    this.summedTimings = this.timings.reduce(
      (acc, subtiming) => acc + subtiming._value,
      0
    );
    this.elapsed = 0;

    this.progressBar = new ProgressBar(
      chalkTemplate`[${cliStringConsole}] progress: :bar :percent [{blue.bold :step}/{blue.bold :numSteps}][{bold.keyword('purple') :remaining}]`,
      {
        complete: chalkTemplate`{keyword('green') ▮}`,
        incomplete: chalkTemplate`{keyword('grey') ▮}`,
        head: chalkTemplate`{keyword('orange') ▮}`,
        width: 50,
        total: this.summedTimings,
        stream: process.stdout,
        clear: false,
        callback: this.stopIntervals
      }
    );

    this.progressBar.tick(this.getTickOptions());

    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.cumulatedElapsedTime = 0;

    this.interval = setInterval(() => {
      this.setTimings();
      this.progressBar.tick(this.getElapsedTime(), this.getTickOptions());
    }, 100);
  }

  getElapsedTime(): number {
    const stepTiming = this.timings.find(
      (timing) => timing._field === this.subcommand
    );
    const timing = stepTiming ? stepTiming._value : 0;

    if (this.cumulatedElapsedTime > timing) return 0;
    return this.elapsedTime;
  }

  setTimings(): void {
    this.elapsedTime = Date.now() - this.startTime;
    this.startTime = Date.now();
    this.cumulatedElapsedTime += this.elapsedTime;
    this.elapsed += this.elapsedTime;
  }

  getTickOptions(): {
    step: number;
    numSteps: number;
    command: string;
    subcommand: string;
    remaining: string;
  } {
    const remainingMs = this.summedTimings - this.elapsed;
    let remaining: string;

    if (remainingMs >= 0) {
      remaining = prettyMs(Math.abs(remainingMs), {
        secondsDecimalDigits: 0,
        keepDecimalsOnWholeSeconds: true
      });
    } else {
      remaining = `+${prettyMs(Math.abs(remainingMs), {
        secondsDecimalDigits: 0,
        keepDecimalsOnWholeSeconds: true
      })}`;
    }

    return {
      step: this.step,
      numSteps: this.numSteps,
      command: this.command,
      subcommand: this.subcommand,
      remaining
    };
  }

  log(info: winston.Logform.TransformableInfo, callback: () => void): void {
    setImmediate(() => {
      this.emit('logged', info);
    });

    this.progressBar.interrupt(this.formatConsole(info));
    this.setTimings();

    if (info.step) this.step = info.step;
    if (info.numSteps) this.numSteps = info.numSteps;
    if (info.command) this.command = info.command;
    if (info.subcommand) this.subcommand = info.subcommand;

    this.progressBar.tick(this.getElapsedTime(), this.getTickOptions());
    callback();
  }

  completeStep(stepName: string): void {
    this.setTimings();
    const timing = this.timings.find((t) => t._field === stepName);
    const stepTiming = (timing && timing._value) || 0;
    const timeToTick = stepTiming - this.cumulatedElapsedTime;
    this.elapsed += timeToTick;

    this.progressBar.tick(timeToTick, this.getTickOptions());

    this.elapsedTime = 0;
    this.cumulatedElapsedTime = 0;
  }

  stopIntervals(): void {
    if (this.progressBar) this.progressBar.terminate();
    clearInterval(this.interval);
  }

  getProgressBar(): ProgressBar {
    return this.progressBar;
  }
}
