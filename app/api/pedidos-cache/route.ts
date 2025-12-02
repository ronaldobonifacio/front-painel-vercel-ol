import { NextRequest, NextResponse } from 'next/server'
import { getPedidosComCache } from '@/lib/getPedidosComCache'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || undefined
  try {
    const pedidos = await getPedidosComCache(date)
    return NextResponse.json(pedidos)
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 })
  }
}
