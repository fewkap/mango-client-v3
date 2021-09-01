import BN from 'bn.js';
import { FillEvent, LiquidateEvent, OutEvent, ZERO_BN } from '.';

export default class PerpEventQueue {
  head!: BN;
  count!: BN;
  seqNum!: BN;
  events!: any[];

  constructor(decoded: any) {
    Object.assign(this, decoded);
  }

  getUnconsumedEvents(): {
    fill?: FillEvent;
    out?: OutEvent;
    liquidate?: LiquidateEvent;
  }[] {
    const events: { fill?: FillEvent; out?: OutEvent }[] = [];
    const head = this.head.toNumber();
    for (let i = 0; i < this.count.toNumber(); i++) {
      events.push(this.events[(head + i) % this.events.length]);
    }
    return events;
  }

  /**
   * Returns events since the lastSeqNum you've seen. If you haven't seen any yet,
   * send in undefined for lastSeqNum
   */
  eventsSince(
    lastSeqNum?: BN,
  ): { fill?: FillEvent; out?: OutEvent; liquidate?: LiquidateEvent }[] {
    const filtered: {
      fill?: FillEvent;
      out?: OutEvent;
      liquidate?: LiquidateEvent;
    }[] = [];
    for (const e of this.events) {
      if (e.fill) {
        if (lastSeqNum === undefined && e.fill.timestamp.gt(ZERO_BN)) {
          filtered.push(e);
        } else if (lastSeqNum !== undefined && e.fill.seqNum.gt(lastSeqNum)) {
          filtered.push(e);
        }
      } else if (e.out) {
        if (lastSeqNum === undefined && e.out.timestamp.gt(ZERO_BN)) {
          filtered.push(e);
        } else if (lastSeqNum !== undefined && e.out.seqNum.gt(lastSeqNum)) {
          filtered.push(e);
        }
      } else if (e.liquidate) {
        if (lastSeqNum === undefined && e.liquidate.timestamp.gt(ZERO_BN)) {
          filtered.push(e);
        } else if (
          lastSeqNum !== undefined &&
          e.liquidate.seqNum.gt(lastSeqNum)
        ) {
          filtered.push(e);
        }
      }
    }

    // No need to sort because events already sorted
    return filtered;

    // let filtered: (FillEvent | OutEvent | LiquidateEvent)[];
    // if (lastSeqNum === undefined) {
    //   filtered = flatEvents
    //     .filter((e) => e.timestamp.gt(ZERO_BN))
    //     .sort((a, b) => a.seqNum.cmp(b.seqNum));
    // } else {
    //   filtered = flatEvents
    //     .filter((e) => e.seqNum.gt(lastSeqNum))
    //     .sort((a, b) => a.seqNum.cmp(b.seqNum));
    // }
    //
    // // @ts-ignore
    // return filtered.map((e) => {
    //   if (e['eventType'] === 'fill') {
    //     return { fill: e };
    //   } else if (e['eventType'] === 'out') {
    //     return { out: e };
    //   } else if (e['eventType'] === 'liquidate') {
    //     return { liquidate: e };
    //   }
    //   // undefined if it's not one of those event types which it shouldn't be anyway
    // });

    // const modulo64Uint = new BN('10000000000000000', 'hex');
    // let missedEvents = this.seqNum
    //   .add(modulo64Uint)
    //   .sub(lastSeqNum)
    //   .mod(modulo64Uint);
    //
    // /*
    // console.log({
    //   last: lastSeqNum.toString(),
    //   now: this.seqNum.toString(),
    //   missed: missedEvents.toString(),
    //   mod: modulo64Uint.toString(),
    // });
    // */
    //
    // const bufferLength = new BN(this.events.length);
    // if (missedEvents.gte(bufferLength)) {
    //   missedEvents = bufferLength.sub(new BN(1));
    // }
    //
    // const endIndex = this.head.add(this.count).mod(bufferLength);
    // const startIndex = endIndex
    //   .add(bufferLength)
    //   .sub(missedEvents)
    //   .mod(bufferLength);
    //
    // /*
    // console.log({
    //   bufLength: bufferLength.toString(),
    //   missed: missedEvents.toString(),
    //   head: this.head.toString(),
    //   count: this.count.toString(),
    //   end: endIndex.toString(),
    //   start: startIndex.toString(),
    // });
    // */
    //
    // const results: {
    //   fill?: FillEvent;
    //   out?: OutEvent;
    //   liquidate?: LiquidateEvent;
    // }[] = [];
    // let index = startIndex;
    // while (!index.eq(endIndex)) {
    //   const event = this.events[index.toNumber()];
    //   if (event.fill || event.out || event.liquidate) results.push(event);
    //   index = index.add(new BN(1)).mod(bufferLength);
    // }
    //
    // return results;
  }
}
