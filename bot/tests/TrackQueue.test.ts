import { describe, expect, it } from 'vitest';
import { TrackQueue } from '../src/music/queue/TrackQueue';
import type { QueueTrack } from '../src/types/music';

function track(id: string): QueueTrack {
  return {
    encoded: id,
    identifier: id,
    title: `Track ${id}`,
    author: 'artist',
    uri: null,
    length: 1000,
    isStream: false,
    artworkUrl: null,
    sourceName: null,
    requestedBy: 'tester',
  };
}

describe('TrackQueue', () => {
  it('adds and shifts in FIFO order', () => {
    const queue = new TrackQueue();
    queue.add(track('a'));
    queue.add(track('b'));
    expect(queue.shift()?.title).toBe('Track a');
    expect(queue.shift()?.title).toBe('Track b');
    expect(queue.isEmpty).toBe(true);
  });

  it('records playback history on shift', () => {
    const queue = new TrackQueue();
    queue.add(track('a'));
    queue.shift();
    expect(queue.getHistory()).toHaveLength(1);
  });

  it('enforces the maximum size', () => {
    const queue = new TrackQueue(2);
    expect(queue.add(track('a'))).toBe(true);
    expect(queue.add(track('b'))).toBe(true);
    expect(queue.add(track('c'))).toBe(false);
    expect(queue.size).toBe(2);
  });

  it('addMany stops at the limit', () => {
    const queue = new TrackQueue(3);
    expect(queue.addMany([track('a'), track('b'), track('c'), track('d')])).toBe(3);
  });

  it('removes by index and bounds-checks', () => {
    const queue = new TrackQueue();
    queue.add(track('a'));
    queue.add(track('b'));
    queue.add(track('c'));
    expect(queue.remove(1)?.title).toBe('Track b');
    expect(queue.size).toBe(2);
    expect(queue.remove(99)).toBeUndefined();
  });

  it('moves tracks', () => {
    const queue = new TrackQueue();
    queue.add(track('a'));
    queue.add(track('b'));
    queue.add(track('c'));
    expect(queue.move(0, 2)).toBe(true);
    expect(queue.toArray().map((t) => t.title)).toEqual(['Track b', 'Track c', 'Track a']);
    expect(queue.move(0, 0)).toBe(false);
    expect(queue.move(0, 99)).toBe(false);
  });

  it('shuffles into a permutation', () => {
    const queue = new TrackQueue();
    const ids = ['a', 'b', 'c', 'd', 'e'];
    for (const id of ids) queue.add(track(id));
    queue.shuffle();
    expect(new Set(queue.toArray().map((t) => t.title))).toEqual(
      new Set(ids.map((id) => `Track ${id}`)),
    );
  });

  it('previous returns the track before the current one', () => {
    const queue = new TrackQueue();
    queue.add(track('a'));
    queue.add(track('b'));
    queue.add(track('c'));
    queue.shift(); // a
    queue.shift(); // b is "current"
    expect(queue.previous()?.title).toBe('Track a');
  });
});
