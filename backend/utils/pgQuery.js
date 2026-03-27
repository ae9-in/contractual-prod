function mysqlPlaceholdersToPg(sql, params = []) {
  let i = 0;
  const text = sql.replace(/\?/g, () => {
    i += 1;
    return `$${i}`;
  });
  if (i !== params.length) {
    throw new Error(`SQL expected ${i} placeholders, got ${params.length} params`);
  }
  return { text, values: params };
}

function shapeMysqlStyleResult(result) {
  const cmd = result.command;
  if (cmd === 'SELECT' || cmd === 'WITH' || cmd === 'SHOW' || cmd === 'DEALLOCATE') {
    return [result.rows || [], []];
  }
  if (cmd === 'INSERT') {
    const id = result.rows?.[0]?.id;
    return [
      {
        insertId: result.rows?.length && id != null ? Number(id) : undefined,
        affectedRows: result.rowCount || 0,
      },
      [],
    ];
  }
  return [{ affectedRows: result.rowCount || 0, insertId: undefined }, []];
}

module.exports = { mysqlPlaceholdersToPg, shapeMysqlStyleResult };
