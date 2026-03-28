/**
 * Mirrors AppState into boards / lists / cards so Workbench & SQL see normal rows.
 * app_state.payload stays the source the React app reads/writes.
 */

function toMysqlDateTime(iso) {
  if (!iso) return new Date();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

export async function syncToRelationalTables(pool, state) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM cards');
    await conn.query('DELETE FROM lists');
    await conn.query('DELETE FROM boards');

    for (const b of state.boards) {
      const bg = b.background || { type: 'gradient', value: '' };
      const bgType = bg.type === 'solid' ? 'solid' : 'gradient';
      await conn.query(
        'INSERT INTO boards (id, title, bg_type, bg_value, created_at) VALUES (?, ?, ?, ?, ?)',
        [b.id, b.title, bgType, String(bg.value), toMysqlDateTime(b.createdAt)]
      );
    }

    for (const l of state.lists) {
      await conn.query(
        'INSERT INTO lists (id, board_id, title, position) VALUES (?, ?, ?, ?)',
        [l.id, l.boardId, l.title, l.position]
      );
    }

    for (const c of state.cards) {
      await conn.query(
        `INSERT INTO cards (
          id, list_id, title, description, position, due_date, archived,
          labels_json, checklist_json, member_ids_json, comments_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.listId,
          c.title,
          c.description ?? '',
          c.position,
          c.dueDate || null,
          c.archived ? 1 : 0,
          JSON.stringify(c.labels ?? []),
          JSON.stringify(c.checklist ?? []),
          JSON.stringify(c.memberIds ?? []),
          JSON.stringify(c.comments ?? []),
          toMysqlDateTime(c.createdAt),
        ]
      );
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
