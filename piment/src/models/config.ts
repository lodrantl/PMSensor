export class PmChart {
  constructor(
    public pm_10: number,
    public pm_25: number,
    public time: Date,
    public series: number[][]
  ) { }
}

export class PmBox {
  constructor(
    public id: string,
    public url: string
  ) { }
}

export class PmConfig {
  constructor(
    public box: PmBox,
    public unit: string,
    public time: number
  ) { }
}
