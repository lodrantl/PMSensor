export class Measurement {
  constructor(
    public start: Date,
    public end: Date,
    public pushed: Date,
    public comment: string
  ) { }
}