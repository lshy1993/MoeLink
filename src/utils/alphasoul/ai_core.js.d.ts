export type Suit = 'm' | 'p' | 's' | 'z';
export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
export type TileCode = `${Digit}${Suit}`;
export type FuluCode = string;

export type PaishuMPS = [number, number, number, number, number, number, number, number, number, number];
export type PaishuZ = [number, number, number, number, number, number, number, number];
export type Paishu = {
  m: PaishuMPS;
  p: PaishuMPS;
  s: PaishuMPS;
  z: PaishuZ;
};

export type CalResItem = [TileCode, number, TileCode[], number, number];
export type SafeResItem = [TileCode, number[]];
export type XianwuMap = Partial<Record<TileCode, number>>;
export type Xianwu = [XianwuMap, XianwuMap, XianwuMap, XianwuMap];

export interface InitStatusAction {
  ju: number;
  ben: number;
  chang: number;
  lizhibang: number;
  scores: [number, number, number, number];
  dora: TileCode;
  tiles: TileCode[];
}

export class AI_Core {
  qinjia: number;
  zhuangfeng: number;
  zifeng: number;
  changbang: number;
  lizhibang: number;
  score: [number, number, number, number];
  bao: TileCode[];
  handStack: TileCode[];
  fuluStack: FuluCode[];
  playerRiver: TileCode[][];
  playerWind: [number, number, number, number];
  playerLizhi: [number, number, number, number];
  cal_res: CalResItem[];
  paishu: Paishu;
  xianwu: Xianwu;
  lastDiscard?: TileCode;
  safe_res?: SafeResItem[];

  constructor();
  ResetParam(zi: number): void;
  ResetPaiCount(): void;
  weixian(pai: TileCode, l: number): number;
  paijia(p: TileCode): number;
  fulu_tingpai(hand: TileCode[], fulu: FuluCode[]): TileCode[];
  fulu_xiangting(hand: TileCode[], fulu: FuluCode[]): number;
  xiangting_menqian(shoupai: Paishu | any, fulu: FuluCode[]): number;
  xiangting_fanpai(shoupai: Paishu | any, fulu: FuluCode[]): number;
  xiangting_duanyao(shoupai: Paishu | any, fulu: FuluCode[]): number;
  xiangting_duidui(shoupai: Paishu | any, fulu: FuluCode[]): number;
  xiangting_yise(shoupai: Paishu | any, fulu: FuluCode[], sort: Suit): number;
  deletePai(pai: TileCode): void;
  Safety(pai: TileCode): number;
  FindFulu(mianzi: FuluCode[]): FuluCode | undefined;
  FindSafe(): TileCode | undefined;
  FindQie(dapai?: TileCode): TileCode | undefined;
  TestEvalHand(): void;
  PickDapai(handStack: TileCode[], fuluStack: FuluCode[]): TileCode[];
  GetFen(handStack: TileCode[], fuluStack: FuluCode[]): number;
  EvalHand(handStack: TileCode[], fuluStack: FuluCode[], paishu: Paishu): number;
  InitStatus(action: InitStatusAction): void;
}
