import type { Evenement } from '../schemas/calendar';
import { minutesOf } from './days';

const DAY_MINUTES = 24 * 60;

export interface Placed {
  e: Evenement;
  start: number;
  end: number;
  lane: number;
  lanes: number;
}

/**
 * Where each event of a day sits: from its start to its end in Algiers time
 * (the labels already are), one hour when the end is unknown, cut at midnight
 * for a night shift. Overlapping events share the width, side by side.
 */
export function placeDay(events: Evenement[]): Placed[] {
  const items = events
    .map((e) => {
      const start = minutesOf(e.heureLabel) ?? 0;
      const rawEnd = minutesOf(e.heureFinLabel);
      const end = rawEnd == null ? start + 60 : rawEnd <= start ? DAY_MINUTES : rawEnd;
      return { e, start, end: Math.min(Math.max(end, start + 30), DAY_MINUTES), lane: 0, lanes: 1 };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  // Clusters of overlapping events; inside one, each event takes the first free lane.
  let cluster: Placed[] = [];
  let clusterEnd = -1;
  const laneEnds: number[] = [];
  const close = () => {
    const lanes = Math.max(1, ...cluster.map((p) => p.lane + 1));
    for (const p of cluster) p.lanes = lanes;
    cluster = [];
    laneEnds.length = 0;
  };
  for (const item of items) {
    if (item.start >= clusterEnd) close();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = item.end;
    item.lane = lane;
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  close();
  return items;
}
