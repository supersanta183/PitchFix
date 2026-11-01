import { Note } from './note';

describe('Note', () => {
  it('names notes with sharps and scientific octave numbers', () => {
    expect(Note.fromMidi(60).label).toBe('C4');
    expect(Note.fromMidi(61).label).toBe('C#4');
    expect(Note.fromMidi(69).label).toBe('A4');
    expect(Note.fromMidi(59).label).toBe('B3');
  });

  it('exposes pitch class and octave separately', () => {
    const note = Note.fromMidi(42);
    expect(note.name).toBe('F#');
    expect(note.octave).toBe(2);
  });

  it('parses note labels, including flats', () => {
    expect(Note.fromLabel('A4').midi).toBe(69);
    expect(Note.fromLabel('C#3').midi).toBe(49);
    expect(Note.fromLabel('Db3').midi).toBe(49);
    expect(Note.fromLabel('c-1').midi).toBe(0);
  });

  it('rejects labels that are not notes', () => {
    expect(() => Note.fromLabel('H2')).toThrow();
    expect(() => Note.fromLabel('C')).toThrow();
  });

  it('rejects MIDI numbers that are not whole notes in the MIDI range', () => {
    expect(() => Note.fromMidi(60.5)).toThrow();
    expect(() => Note.fromMidi(-1)).toThrow();
    expect(() => Note.fromMidi(128)).toThrow();
  });

  it('knows its frequency', () => {
    expect(Note.fromLabel('A3').frequency).toBe(220);
  });

  it('finds the nearest note to a sung frequency', () => {
    expect(Note.nearestTo(445).label).toBe('A4');
    expect(Note.nearestTo(130).label).toBe('C3');
    expect(Note.nearestTo(452).label).toBe('A4');
    expect(Note.nearestTo(454).label).toBe('A#4');
  });

  it('measures how many cents a frequency is from it', () => {
    const a4 = Note.fromLabel('A4');
    expect(a4.centsFrom(440)).toBe(0);
    expect(a4.centsFrom(880)).toBeCloseTo(1200, 9);
    expect(a4.centsFrom(435)).toBeLessThan(0);
  });

  it('transposes by semitones', () => {
    expect(Note.fromLabel('C4').transpose(7).label).toBe('G4');
    expect(Note.fromLabel('C4').transpose(-1).label).toBe('B3');
  });

  it('compares by pitch', () => {
    expect(Note.fromLabel('C#4').equals(Note.fromLabel('Db4'))).toBe(true);
    expect(Note.fromLabel('C4').equals(Note.fromLabel('C5'))).toBe(false);
  });
});
