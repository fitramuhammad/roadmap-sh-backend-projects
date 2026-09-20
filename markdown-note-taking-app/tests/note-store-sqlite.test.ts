import { describe, it, expect, beforeEach } from 'bun:test';
import { SqliteNoteStore } from '../server/note-store-sqlite';
import type { Note } from '../server/types';
import { unlinkSync, existsSync } from 'node:fs';

const TEST_DB = './data/test-notes.db';

describe('SqliteNoteStore', () => {
  let store: SqliteNoteStore;

  beforeEach(() => {
    if (existsSync(TEST_DB)) {
      unlinkSync(TEST_DB);
    }
    store = new SqliteNoteStore(TEST_DB);
  });

  it('saves and finds a note', async () => {
    const note: Note = {
      id: 'note-1',
      title: 'Testing SQLite',
      markdown: '# Testing SQLite\n\nContent here',
      createdAt: '2026-09-16 10:00:00',
    };

    await store.save(note);
    const found = await store.find('note-1');

    expect(found).not.toBeNull();
    expect(found?.id).toBe(note.id);
    expect(found?.title).toBe(note.title);
    expect(found?.markdown).toBe(note.markdown);
  });

  it('returns null if note is not found', async () => {
    const found = await store.find('non-existent');
    expect(found).toBeNull();
  });

  it('lists notes sorted by createdAt desc', async () => {
    await store.save({
      id: '1',
      title: 'First',
      markdown: 'content 1',
      createdAt: '2026-09-16 09:00:00',
    });

    await store.save({
      id: '2',
      title: 'Second',
      markdown: 'content 2',
      createdAt: '2026-09-16 10:00:00',
    });

    const list = await store.list();
    expect(list.length).toBe(2);
    expect(list[0].title).toBe('Second');
    expect(list[1].title).toBe('First');
  });
});
