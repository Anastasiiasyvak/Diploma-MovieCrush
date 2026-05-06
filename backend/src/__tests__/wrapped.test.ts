import { determineCinemaVibe, calculateTimeStats, calculateFanPercentile } from '../modules/wrapped/wrapped.service';

describe('determineCinemaVibe', () => {

  it('returns null if no decades provided', () => {
    const result = determineCinemaVibe([]);
    expect(result.cinema_vibe).toBeNull();
    expect(result.cinema_vibe_stat).toBeNull();
  });

  it('returns Modern Watcher when 60%+ watches from 2020s', () => {
    const decades = [
      { decade: 2020, cnt: 70 },
      { decade: 2010, cnt: 30 },
    ];
    const result = determineCinemaVibe(decades);
    expect(result.cinema_vibe).toBe('Modern Watcher 🆕');
    expect(result.cinema_vibe_stat).toContain('70%');
    expect(result.cinema_vibe_stat).toContain('2020s');
  });

  it('does not return Modern Watcher if top decade is 2020s but less than 60%', () => {
    const decades = [
      { decade: 2020, cnt: 50 },
      { decade: 2010, cnt: 50 },
    ];
    const result = determineCinemaVibe(decades);
    expect(result.cinema_vibe).not.toBe('Modern Watcher 🆕');
  });

  it('returns Time Traveler when 3+ decades have 10%+ each', () => {
    const decades = [
      { decade: 2020, cnt: 40 },
      { decade: 2010, cnt: 35 },
      { decade: 2000, cnt: 25 },
    ];
    const result = determineCinemaVibe(decades);
    expect(result.cinema_vibe).toBe('Time Traveler 🕰️');
    expect(result.cinema_vibe_stat).toContain('3');
  });

  it('returns Classic Soul when 30%+ watches are pre-2000', () => {
    const decades = [
      { decade: 2010, cnt: 65 },
      { decade: 1990, cnt: 35 },
    ]; 
    const result = determineCinemaVibe(decades);
    expect(result.cinema_vibe).toBe('Classic Soul 🎞️');
    expect(result.cinema_vibe_stat).toContain('35%');
  });

  it('returns Decade Surfer for all other cases', () => {
    const decades = [
      { decade: 2010, cnt: 70 },
      { decade: 2000, cnt: 30 },
    ];
    const result = determineCinemaVibe(decades);
    expect(result.cinema_vibe).toBe('Decade Surfer 🏄');
    expect(result.cinema_vibe_stat).toContain('2010s');
  });

  it('Time Traveler takes priority over Classic Soul', () => {
    const decades = [
      { decade: 2020, cnt: 35 },
      { decade: 1990, cnt: 35 },
      { decade: 1980, cnt: 30 },
    ];
    const result = determineCinemaVibe(decades);
    expect(result.cinema_vibe).toBe('Time Traveler 🕰️');
  });

  it('returns Classic Soul for old cinema 1930-1960', () => {
    const decades = [
      { decade: 1950, cnt: 60 },
      { decade: 1930, cnt: 40 },
    ];
    const result = determineCinemaVibe(decades);
    expect(result.cinema_vibe).toBe('Classic Soul 🎞️');
    expect(result.cinema_vibe_stat).toContain('100%');
  });

  it('returns Time Traveler for spread across 1930-1960 and modern', () => {
    const decades = [
      { decade: 2020, cnt: 35 },
      { decade: 1950, cnt: 35 },
      { decade: 1930, cnt: 30 },
    ];
    const result = determineCinemaVibe(decades);
    expect(result.cinema_vibe).toBe('Time Traveler 🕰️');
  });

});

describe('calculateTimeStats', () => {

  it('correctly calculates hours and days from minutes', () => {
    const result = calculateTimeStats(120);
    expect(result.total_hours).toBe(2);
    expect(result.total_days).toBe(0.1);
  });

  it('calculates exactly 1 day from 1440 minutes', () => {
    const result = calculateTimeStats(1440);
    expect(result.total_hours).toBe(24);
    expect(result.total_days).toBe(1);
  });

  it('returns 0 for 0 minutes', () => {
    const result = calculateTimeStats(0);
    expect(result.total_hours).toBe(0);
    expect(result.total_days).toBe(0);
  });

  it('rounds hours correctly', () => {
    const result = calculateTimeStats(90);
    expect(result.total_hours).toBe(2);
  });

});

describe('calculateFanPercentile', () => {

  it('returns correct percentile', () => {
    const result = calculateFanPercentile(7, 100);
    expect(result).toBe(7);
  });

  it('returns null when totalUsers is 0', () => {
    const result = calculateFanPercentile(5, 0);
    expect(result).toBeNull();
  });

  it('returns minimum 0.1 when result rounds to 0', () => {
    const result = calculateFanPercentile(1, 100000);
    expect(result).toBe(0.1);
  });

  it('returns 100 when all users are fans', () => {
    const result = calculateFanPercentile(50, 50);
    expect(result).toBe(100);
  });

});