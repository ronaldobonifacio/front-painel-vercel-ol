import { unstable_cache } from 'next/cache'

export interface PedidoAPI {
  id: string
  numpedido: number
  fornecedor: string
  valor: number
  valorfat: number
  data: string
  lost: number
  cliente: string
  status: string
  filial: string
  hora: string
  nome_cliente: string
  pedidos_internos: string
  carga: string
  condpag: string
}

async function fetchPedidos(date?: string): Promise<PedidoAPI[]> {
  const url = new URL('http://192.168.0.181:3002/pedidos')
  if (date) {
    url.searchParams.set('date', date)
  }
  const response = await fetch(url.toString())
  if (!response.ok) throw new Error('Erro na requisição')
  return response.json()
}

export const getPedidosComCache = unstable_cache(
  async (date?: string) => {
    return fetchPedidos(date)
  },
  ['pedidos-cache-key'],
  { revalidate: 60 }
)
