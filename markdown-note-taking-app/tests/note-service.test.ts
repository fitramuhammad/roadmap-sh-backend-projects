import { describe, it, expect, beforeEach } from 'bun:test';
import { InMemoryNoteStore } from '../server/note-store-memory';
import { MarkedRenderer } from '../server/markdown-renderer';
import { NoopGrammarChecker } from '../server/grammar-checker-noop';
import { createNoteService, NoteNotFoundError } from '../server/note-service';
import type { NoteService } from '../server/note-service';

let service: NoteService;

beforeEach(() => {
  service = createNoteService(
    new InMemoryNoteStore(),
    new MarkedRenderer(),
    new NoopGrammarChecker(),
  );
});

describe('save', () => {
  it('returns a note with an id and extracted title', async () => {
    const note = await service.save('# Hello\n\nSome text.');
    expect(note.id).toBeString();
    expect(note.title).toBe('Hello');
    expect(note.markdown).toBe('# Hello\n\nSome text.');
  });

  it('falls back to first non-empty line when there is no heading', async () => {
    const note = await service.save('Just a plain note.');
    expect(note.title).toBe('Just a plain note.');
  });

  it('uses Untitled for blank markdown', async () => {
    const note = await service.save('   ');
    expect(note.title).toBe('Untitled');
  });

  it('updates an existing note when id is provided', async () => {
    const created = await service.save('# First Title\n\nInitial content.');
    const updated = await service.save('# Updated Title\n\nUpdated content.', created.id);
    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe('Updated Title');
    expect(updated.markdown).toBe('# Updated Title\n\nUpdated content.');
    expect(updated.createdAt).toBe(created.createdAt);
  });
});

describe('list', () => {
  it('returns notes in reverse chronological order', async () => {
    await service.save('# First');
    await service.save('# Second');
    const notes = await service.list();
    expect(notes[0].title).toBe('Second');
    expect(notes[1].title).toBe('First');
  });

  it('returns an empty array when there are no notes', async () => {
    expect(await service.list()).toEqual([]);
  });
});

describe('render', () => {
  it('returns HTML for a saved note', async () => {
    const note = await service.save('# Title\n\nParagraph.');
    const html = await service.render(note.id);
    expect(html).toContain('<h1');
    expect(html).toContain('Title');
    expect(html).toContain('<p>');
  });

  it('throws NoteNotFoundError for an unknown id', async () => {
    await expect(service.render('no-such-id')).rejects.toBeInstanceOf(NoteNotFoundError);
  });
});

describe('checkGrammar', () => {
  it('returns an empty array from the noop checker', async () => {
    const note = await service.save('# Test\n\nSome text.');
    const issues = await service.checkGrammar(note.id);
    expect(issues).toEqual([]);
  });

  it('throws NoteNotFoundError for an unknown id', async () => {
    await expect(service.checkGrammar('no-such-id')).rejects.toBeInstanceOf(NoteNotFoundError);
  });
});
