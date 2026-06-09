import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Conecta no PostgreSQL do Docker usando os dados do docker-compose
const pool = new Pool({
  user: 'airflow',
  host: 'localhost',
  database: 'airflow',
  password: 'airflow',
  port: 5432,
});

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM fato_vendas');
    
    // Converte a data do Postgres para string no formato YYYY-MM-DD para o frontend
    const linhasFormatadas = result.rows.map(row => ({
      ...row,
      data_transacao: row.data_transacao ? row.data_transacao.toISOString().split('T')[0] : null
    }));

    return NextResponse.json(linhasFormatadas);
  } catch (error) {
    console.error('Erro ao conectar no banco:', error);
    return NextResponse.json({ erro: 'Falha ao buscar dados do banco' }, { status: 500 });
  }
}