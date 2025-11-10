"use client"
import * as React from "react"
import { useEffect, useState } from "react"
import { Filter, PackageOpen, XCircle, Search, CalendarIcon, Info, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Package, DollarSign, CreditCard, Users, X, Settings, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useIsMobile } from "@/hooks/use-mobile"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface PedidoAPI {
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

interface PedidoFormatado {
  id: number
  pedido: string
  fornecedor: string
  fornecedorOriginal: string
  cliente: string
  filial: string
  valor: string
  valorNumerico: number
  valorfatNumerico: number
  data: string
  hora: string
  status: string
  pedidos_internos: string
  carga: string
  condpag: string
}

interface PedidoDetalhado {
  id: string
  codPro: string
  numPedido: number
  fornecedor: string
  status: string
  numC5: string
  filC5: string
  filial: string
  dataImportacao: string
  codCli: string
  lojCli: string
  departamento: string
  numDI: string
  descricao: string
  qtdPro: number
  qtdLib: number
  serie: string
  doc: string
  cargaC9: string
  pedPalm: string
  desconto: number
  horaFinal: string
  nome: string
  cgc: string
  endereco: string
  preco: number
  totalfat: number
  lote: string
}

const StatusIndicator = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case "Faturado":
        return { bg: "bg-green-100", text: "text-green-800", icon: "✓" }
      case "Aguardando":
        return { bg: "bg-yellow-100", text: "text-yellow-800", icon: "⏳" }
      case "Falha na importação":
        return { bg: "bg-red-100", text: "text-red-800", icon: "⚠️" }
      default:
        return { bg: "bg-blue-100", text: "text-blue-800", icon: "🔄" }
    }
  }

  const style = getStatusStyle()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={`${style.bg} ${style.text} gap-1 hover:opacity-80`}>
            <span>{style.icon}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <span>{status}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function AdminPanel() {
  const isDesktop = !useIsMobile()
  const [pedidos, setPedidos] = React.useState<PedidoFormatado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: "ascending" | "descending" } | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 7
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [isCalendarOpenDesktop, setIsCalendarOpenDesktop] = React.useState(false)
  const [isCalendarOpenMobile, setIsCalendarOpenMobile] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([])
  const [openPopoverCliente, setOpenPopoverCliente] = React.useState<number | null>(null)
  const [selectedPedido, setSelectedPedido] = React.useState<string | null>(null)
  const [pedidoDetails, setPedidoDetails] = React.useState<PedidoDetalhado[] | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false)
  const [errorDetails, setErrorDetails] = React.useState<string | null>(null)
  const [fornecedorOriginalModal, setFornecedorOriginalModal] = React.useState<string | null>(null)
  const [isReenviandoPedido, setIsReenviandoPedido] = React.useState(false)
  const [isReenviandoNF, setIsReenviandoNF] = React.useState(false)
  const { toast } = useToast()

  const formatarData = (dataString: string) => {
    const [ano, mes, dia] = dataString.match(/(\d{4})(\d{2})(\d{2})/)?.slice(1) || []
    return dia && mes && ano ? `${dia}/${mes}/${ano}` : 'Data inválida'
  }

  const mapearStatus = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey) {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  React.useEffect(() => {
    const fetchPedidoDetails = async () => {
      if (!selectedPedido) return
      setIsLoadingDetails(true)
      setErrorDetails(null)
      try {
        const response = await fetch(`http://192.168.0.181:3002/pedidos/${selectedPedido}`)
        if (!response.ok) throw new Error('Erro ao buscar detalhes do pedido')
        const data = await response.json()
        setPedidoDetails(data[selectedPedido])
      } catch (err) {
        setErrorDetails(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setIsLoadingDetails(false)
      }
    }
    fetchPedidoDetails()
  }, [selectedPedido])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = new URL('http://192.168.0.181:3002/pedidos')
        if (date) {
          url.searchParams.set('date', format(date, 'yyyyMMdd'))
        }
        const response = await fetch(url.toString())
        if (!response.ok) throw new Error('Erro na requisição')
        const data: PedidoAPI[] = await response.json()
        const sortedByDate = [...data].sort((a, b) => {
          const dateCompare = a.data.localeCompare(b.data)
          if (dateCompare !== 0) return dateCompare
          return a.hora.localeCompare(b.hora)
        })
        const FORNECEDORES_NORMALIZADOS: Record<string, string> = {
          'ACHEAL3.2': 'ACHE',
          'ACHE_EDIAL3.2': 'ACHE',
          'ACHE_EDISE3.2': 'ACHE',
          'EUROCLS': 'EURO',
          'HYPE': 'HYPERA',
          'TEUTO': 'TEUTO',
          'TEUTOSE': 'TEUTO'
        }
        const pedidosFormatados: PedidoFormatado[] = sortedByDate.map((pedido, index) => {
          const fornecedorOriginal = pedido.fornecedor.trim()
          const fornecedorNormalizado = FORNECEDORES_NORMALIZADOS[fornecedorOriginal] || fornecedorOriginal
          return {
            id: index + 1,
            pedido: pedido.numpedido.toString(),
            fornecedor: fornecedorNormalizado,
            fornecedorOriginal: fornecedorOriginal,
            cliente: (pedido.nome_cliente || pedido.cliente).trim(),
            filial: pedido.filial,
            valor: `R$ ${pedido.valor.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`,
            valorNumerico: pedido.valor,
            valorfatNumerico: pedido.valorfat,
            data: formatarData(pedido.data),
            hora: pedido.hora,
            status: mapearStatus(pedido.status),
            pedidos_internos: pedido.pedidos_internos.trim().replace(/,/g, ", "),
            carga: pedido.carga.trim(),
            condpag: pedido.condpag
          }
        })
        setPedidos(pedidosFormatados)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [date])

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (columnName: string) => {
    if (!sortConfig || sortConfig.key !== columnName) {
      return <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    )
  }

  const filteredPedidos = pedidos.filter((pedido) => {
    if (date) {
      const selectedDate = format(date, "dd/MM/yyyy")
      if (pedido.data !== selectedDate) return false
    }
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(pedido.status)) {
      return false
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        pedido.fornecedor.toLowerCase().includes(searchLower) ||
        pedido.fornecedorOriginal.toLowerCase().includes(searchLower) ||
        pedido.cliente.toLowerCase().includes(searchLower) ||
        pedido.filial.toLowerCase().includes(searchLower) ||
        pedido.pedido.includes(searchTerm)
      )
    }
    return true
  })

  const totalPages = Math.ceil(filteredPedidos.length / itemsPerPage)

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [filteredPedidos.length, totalPages, currentPage])

  const sortedData = [...filteredPedidos]
  if (sortConfig !== null) {
    sortedData.sort((a, b) => {
      if (sortConfig.key === "valor") {
        return sortConfig.direction === "ascending"
          ? a.valorNumerico - b.valorNumerico
          : b.valorNumerico - a.valorNumerico
      }
      if (sortConfig.key === "data") {
        const [diaA, mesA, anoA] = a.data.split("/")
        const [diaB, mesB, anoB] = b.data.split("/")
        const dateA = new Date(Number(anoA), Number(mesA) - 1, Number(diaA))
        const dateB = new Date(Number(anoB), Number(mesB) - 1, Number(diaB))
        return sortConfig.direction === "ascending"
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime()
      }
      const aValue = a[sortConfig.key as keyof typeof a]
      const bValue = b[sortConfig.key as keyof typeof b]
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === "ascending" ? aValue - bValue : bValue - aValue
      }
      return sortConfig.direction === "ascending"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })
  }

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem)

  const clearDate = () => {
    setDate(undefined)
    setCurrentPage(1)
  }

  // Recebe explicitamente os parâmetros do pedido, fornecedor original e tipo
  const reenviarRetorno = async ({ pedido, fornecedor, tipo }: { pedido: string | null, fornecedor: string | null, tipo: 'pedido' | 'nf' }) => {
    if (!pedido || !fornecedor) return
    if (tipo === 'pedido') setIsReenviandoPedido(true)
    if (tipo === 'nf') setIsReenviandoNF(true)
    try {
      const response = await fetch('http://192.168.0.181:3002/pedidos/reenviar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pedido,
          fornecedor,
          tipo
        })
      })
      if (!response.ok) throw new Error('Falha ao reenviar o retorno')
      toast({
        title: "Sucesso",
        description: tipo === 'pedido' 
          ? "Retorno do pedido reenviado com sucesso"
          : "Retorno da NF reenviado com sucesso",
      })
    } catch (err) {
      toast({
        title: "Erro",
        description: tipo === 'pedido'
          ? "Falha ao reenviar o retorno do pedido. Tente novamente."
          : "Falha ao reenviar o retorno da NF. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      if (tipo === 'pedido') setIsReenviandoPedido(false)
      if (tipo === 'nf') setIsReenviandoNF(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const valorTotal = filteredPedidos.reduce((total, pedido) => total + pedido.valorNumerico, 0)
  const valorFaturado = filteredPedidos.reduce((total, pedido) => total + pedido.valorfatNumerico, 0)
  const clientesUnicos = new Set(filteredPedidos.map(p => p.cliente)).size

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-blue-900 text-xl">
              <span className="text-blue-900">ASA</span>
              <span className="text-yellow-500">BRANCA</span>
            </div>
            <div className="flex md:hidden items-center gap-2">
              <Popover open={isCalendarOpenMobile} onOpenChange={setIsCalendarOpenMobile}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("flex items-center gap-1", date ? "text-blue-600 bg-blue-50" : "text-blue-600")}
                  >
                    <CalendarIcon className="h-3 w-3" />
                    {date ? format(date, "dd/MM/yy", { locale: ptBR }) : "Data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate)
                      setIsCalendarOpenMobile(false)
                      setCurrentPage(1)
                    }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="search-input"
                type="search"
                placeholder="Buscar por pedido, fornecedor, cliente ou filial"
                className="w-full rounded-full pl-8 pr-4 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Popover open={isCalendarOpenDesktop} onOpenChange={setIsCalendarOpenDesktop}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex items-center gap-2 border-blue-200",
                    date ? "text-blue-600 bg-blue-50" : "text-blue-600",
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Calendário"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate)
                    setIsCalendarOpenDesktop(false)
                    setCurrentPage(1)
                  }}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {date && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearDate}
                className="rounded-full text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center p-6 gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : error ? (
            <div className="col-span-4 text-center text-red-500 py-4">{error}</div>
          ) : (
            <>
              <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 hover:bg-white">
                <CardContent className="flex items-center p-6">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Total Pedidos</p>
                    <h3 className="text-3xl font-bold">{filteredPedidos.length}</h3>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                    <Package className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
              <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 hover:bg-white">
                <CardContent className="flex items-center p-6">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Valor Total</p>
                    <h3 className="text-3xl font-bold">
                      {`R$ ${valorTotal.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}`}
                    </h3>
                  </div>
                  <div className="rounded-full bg-green-100 p-3 text-green-600">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
              <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 hover:bg-white">
                <CardContent className="flex items-center p-6">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Faturado</p>
                    <h3 className="text-3xl font-bold">
                      {`R$ ${valorFaturado.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}`}
                    </h3>
                  </div>
                  <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                    <CreditCard className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
              <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105 hover:bg-white">
                <CardContent className="flex items-center p-6">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Clientes Positivados</p>
                    <h3 className="text-3xl font-bold">{clientesUnicos}</h3>
                  </div>
                  <div className="rounded-full bg-orange-100 p-3 text-orange-600">
                    <Users className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 mb-1">
              <Filter className="h-4 w-4" />
              Status
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            {['Faturado', 'Aguardando', 'Falha na importação', 'Em processamento'].map((status) => (
              <div
                key={status}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => setSelectedStatuses(prev =>
                  prev.includes(status)
                    ? prev.filter(s => s !== status)
                    : [...prev, status]
                )}
              >
                <Checkbox checked={selectedStatuses.includes(status)} />
                <Label>{status}</Label>
              </div>
            ))}
          </PopoverContent>
        </Popover>

        <div className="flex flex-wrap gap-2 mb-4">
          {selectedStatuses.map((status) => (
            <Badge key={status} variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 px-3 py-1">
              {status}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedStatuses(prev => prev.filter(s => s !== status))}
                className="ml-2 h-4 w-4 p-0 text-blue-700 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {date && (
            <Badge variant="outline" className="text-sm bg-blue-50 border-blue-200 text-blue-700 px-3 py-1">
              Data: {format(date, "dd/MM/yyyy", { locale: ptBR })}
              <Button
                variant="ghost"
                size="icon"
                onClick={clearDate}
                className="ml-2 h-4 w-4 p-0 text-blue-700 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {searchTerm && (
            <Badge variant="outline" className="text-sm bg-blue-50 border-blue-200 text-blue-700 px-3 py-1">
              Busca: {searchTerm}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchTerm("")}
                className="ml-2 h-4 w-4 p-0 text-blue-700 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto border-t rounded-lg">
              <Table className="min-w-[1200px]">
                <TableHeader className="bg-blue-600 text-white sticky top-0 z-20">
                  <TableRow>
                    <TableHead className="text-white font-medium cursor-pointer">
                      <div className="flex items-center">ID</div>
                    </TableHead>
                    <TableHead className="text-white font-medium cursor-pointer" onClick={() => requestSort("pedido")}>
                      <div className="flex items-center">PEDIDO {getSortIcon("pedido")}</div>
                    </TableHead>
                    <TableHead className="text-white font-medium cursor-pointer" onClick={() => requestSort("fornecedor")}>
                      <div className="flex items-center">FORNECEDOR {getSortIcon("fornecedor")}</div>
                    </TableHead>
                    <TableHead className="text-white font-medium cursor-pointer" onClick={() => requestSort("cliente")}>
                      <div className="flex items-center">CLIENTE {getSortIcon("cliente")}</div>
                    </TableHead>
                    <TableHead className="text-white font-medium cursor-pointer" onClick={() => requestSort("filial")}>
                      <div className="flex items-center">FILIAL {getSortIcon("filial")}</div>
                    </TableHead>
                    <TableHead className="text-white font-medium cursor-pointer" onClick={() => requestSort("valor")}>
                      <div className="flex items-center">VALOR {getSortIcon("valor")}</div>
                    </TableHead>
                    <TableHead className="text-white font-medium cursor-pointer" onClick={() => requestSort("pedidos_internos")}>
                      <div className="flex items-center">PEDIDOS INTERNOS {getSortIcon("pedidos_internos")}</div>
                    </TableHead>
                    <TableHead className="text-white font-medium cursor-pointer" onClick={() => requestSort("condpag")}>
                      <div className="flex items-center">COND. PAG.{getSortIcon("condpag")}</div>
                    </TableHead>
                    <TableHead className="text-white font-medium cursor-pointer" onClick={() => requestSort("carga")}>
                      <div className="flex items-center">CARGA {getSortIcon("carga")}</div>
                    </TableHead>
                    <TableHead className="text-white font-medium cursor-pointer" onClick={() => requestSort("data")}>
                      <div className="flex items-center">DATA {getSortIcon("data")}</div>
                    </TableHead>
                    <TableHead className="text-white font-medium cursor-pointer" onClick={() => requestSort("hora")}>
                      <div className="flex items-center">HORA {getSortIcon("hora")}</div>
                    </TableHead>
                    <TableHead className="text-white font-medium cursor-pointer" onClick={() => requestSort("status")}>
                      <div className="flex items-center">STATUS {getSortIcon("status")}</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-96 text-center">
                        <div className="py-12 flex flex-col items-center gap-4">
                          <PackageOpen className="h-12 w-12 text-gray-400" />
                          <div className="text-center">
                            <h3 className="font-medium text-lg">Nenhum pedido encontrado</h3>
                            <p className="text-sm text-gray-500 mt-2">
                              {searchTerm || date || selectedStatuses.length > 0
                                ? "Tente ajustar os filtros ou datas"
                                : "Nenhum dado disponível para o período selecionado"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentItems.map((pedido, idx) => (
                      <TableRow
                        key={pedido.pedido + pedido.data + pedido.hora}
                        className={cn(
                          idx % 2 === 0 ? "bg-gray-50" : "bg-white",
                          "transition-colors duration-200 hover:bg-blue-50 hover:cursor-pointer",
                        )}
                      >
                        <TableCell className="font-medium">{indexOfFirstItem + idx + 1}</TableCell>
                        <TableCell className="text-blue-600">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-600 hover:underline"
                            onClick={() => {
                              setSelectedPedido(pedido.pedido)
                              setFornecedorOriginalModal(pedido.fornecedorOriginal)
                            }}
                          >
                            {pedido.pedido}
                          </Button>
                        </TableCell>
                        <TableCell>{pedido.fornecedor}</TableCell>
                        <TableCell>
                          <span
                            className="block max-w-[220px] truncate whitespace-nowrap overflow-hidden"
                            title={pedido.cliente}
                          >
                            {pedido.cliente}
                          </span>
                        </TableCell>
                        <TableCell>{pedido.filial}</TableCell>
                        <TableCell>{pedido.valor}</TableCell>
                        <TableCell className="font-medium">{pedido.pedidos_internos || "-"}</TableCell>
                        <TableCell>{pedido.condpag}</TableCell>
                        <TableCell>{pedido.carga || "-"}</TableCell>
                        <TableCell>{pedido.data}</TableCell>
                        <TableCell>{pedido.hora}</TableCell>
                        <TableCell>
                          <StatusIndicator status={pedido.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-4">
              {currentItems.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-4">
                  <PackageOpen className="h-12 w-12 text-gray-400" />
                  Nenhum pedido encontrado para os filtros selecionados.
                </div>
              ) : (
                currentItems.map((pedido) => (
                  <Card
                    key={pedido.id}
                    className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-95 cursor-pointer"
                    onClick={() => {
                      setSelectedPedido(pedido.pedido)
                      setFornecedorOriginalModal(pedido.fornecedorOriginal)
                    }}
                  >
                    <CardContent className="p-0">
                      <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
                        <div className="font-medium">Pedido #{pedido.pedido}</div>
                        <StatusIndicator status={pedido.status} />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-500 min-w-[48px]">Cliente</div>
                            <Popover open={openPopoverCliente === pedido.id} onOpenChange={open => setOpenPopoverCliente(open ? pedido.id : null)}>
                              <PopoverTrigger asChild>
                                <span
                                  className="font-medium truncate cursor-pointer max-w-[120px] block"
                                  title={pedido.cliente}
                                  onClick={() => setOpenPopoverCliente(pedido.id)}
                                  tabIndex={0}
                                  role="button"
                                >
                                  {pedido.cliente}
                                </span>
                              </PopoverTrigger>
                              <PopoverContent align="start" className="max-w-xs break-words">
                                {pedido.cliente}
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-500 min-w-[48px]">Filial</div>
                            <div className="font-medium">{pedido.filial}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-gray-500">Data/Hora</div>
                            <p className="font-medium">{pedido.data} {pedido.hora}</p>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Valor</div>
                            <p className="font-bold text-lg">{pedido.valor}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="flex items-center justify-center space-x-2 py-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {(() => {
                if (totalPages <= 7) {
                  return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))
                }
                const pageNumbers = []
                pageNumbers.push(1)
                if (currentPage > 3) {
                  pageNumbers.push("ellipsis1")
                }
                const startPage = Math.max(2, currentPage - 1)
                const endPage = Math.min(totalPages - 1, currentPage + 1)
                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(i)
                }
                if (currentPage < totalPages - 2) {
                  pageNumbers.push("ellipsis2")
                }
                if (totalPages > 1) {
                  pageNumbers.push(totalPages)
                }
                return pageNumbers.map((page, index) => {
                  if (page === "ellipsis1" || page === "ellipsis2") {
                    return (
                      <span key={`ellipsis - ${index}`} className="mx-1">
                        ...
                      </span>
                    )
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(Number(page))}
                    >
                      {page}
                    </Button>
                  )
                })
              })()}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Legenda</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Legenda de Status</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Faturado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Aguardando</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Falha na Importação</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Em Processamento</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </main>
      <Dialog open={!!selectedPedido} onOpenChange={(open) => !open && setSelectedPedido(null)}>
        <DialogContent className={cn(
          "max-w-[95vw] rounded-lg",
          isDesktop
            ? "max-h-[90vh] overflow-y-auto"
            : "h-[90vh] max-h-[90vh] overflow-y-auto"
        )}>
          <DialogHeader className={cn("bg-blue-600 text-white p-4", isDesktop ? "rounded-t-lg" : "rounded-t-2xl")}>
            <div className="flex flex-col items-center gap-4">
              <DialogTitle className="text-lg font-semibold text-center">
                {isLoadingDetails || errorDetails ? (
                  <VisuallyHidden>
                    {isLoadingDetails ? "Carregando detalhes..." : "Erro no pedido"}
                  </VisuallyHidden>
                ) : (
                  `Pedido #${selectedPedido}`
                )}
              </DialogTitle>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isLoadingDetails || !!errorDetails}
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white transition-all gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Opções do Pedido
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="border-b border-gray-100 bg-blue-50/50 p-4">
                    <h4 className="text-sm font-semibold text-blue-900">Detalhes do Pedido</h4>
                    <p className="text-xs text-blue-600 mt-1">Informações para reenvio do retorno</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">Número do Pedido</label>
                        <div className="px-3 py-2 bg-gray-50 rounded-md">
                          <p className="text-sm font-mono text-gray-900">{selectedPedido}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">Sistema Original</label>
                        <div className="px-3 py-2 bg-gray-50 rounded-md">
                          <p className="text-sm font-mono text-gray-900">{fornecedorOriginalModal}</p>
                        </div>
                      </div>
                    </div>
                    


                    <div className="pt-2 space-y-3">
                      <Button
                        className="w-full bg-blue-600 text-white hover:bg-blue-700 transform transition-all duration-200 active:scale-95 hover:shadow-lg hover:-translate-y-0.5"
                        disabled={isReenviandoPedido}
                        onClick={() => reenviarRetorno({
                          pedido: selectedPedido,
                          fornecedor: fornecedorOriginalModal,
                          tipo: 'pedido'
                        })}
                      >
                        {isReenviandoPedido ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span className="animate-pulse">Reenviando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 w-full">
                            <RefreshCw className="h-4 w-4 transition-transform duration-200 transform group-hover:rotate-180" />
                            <span>Reenviar Retorno do Pedido</span>
                          </div>
                        )}
                      </Button>

                      {pedidoDetails && pedidoDetails.reduce((sum, item) => sum + (item.totalfat || 0), 0) > 0 && (
                        <Button
                          className="w-full bg-blue-600 text-white hover:bg-blue-700 transform transition-all duration-200 active:scale-95 hover:shadow-lg hover:-translate-y-0.5"
                          disabled={isReenviandoNF}
                          onClick={() => reenviarRetorno({
                            pedido: selectedPedido,
                            fornecedor: fornecedorOriginalModal,
                            tipo: 'nf'
                          })}
                        >
                          {isReenviandoNF ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              <span className="animate-pulse">Reenviando...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 w-full">
                              <CreditCard className="h-4 w-4 transition-transform duration-200 transform group-hover:rotate-180" />
                              <span>Reenviar Retorno da NF</span>
                            </div>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="p-6 text-center space-y-2">
              <PackageOpen className="h-8 w-8 text-blue-600 mx-auto animate-pulse" />
              <p className="text-gray-600">Carregando detalhes do pedido...</p>
            </div>
          ) : errorDetails ? (
            <div className="p-6 text-center space-y-2">
              <XCircle className="h-8 w-8 text-red-600 mx-auto" />
              <p className="text-red-600 font-medium">{errorDetails}</p>
            </div>
          ) : pedidoDetails ? (
            <div className="space-y-6 p-4 bg-gray-50">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <h3 className="text-blue-600 font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Nome/Razão Social</p>
                    <p className="font-medium text-gray-800">{pedidoDetails[0].nome.trim()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">CNPJ</p>
                    <p className="font-mono text-gray-800">{pedidoDetails[0].cgc}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Código Cliente</p>
                    <p className="font-medium text-gray-800">
                      {pedidoDetails[0].codCli}-{pedidoDetails[0].lojCli}
                    </p>
                  </div>
                  {isDesktop && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Endereço</p>
                        <p className="text-gray-800">{pedidoDetails[0].endereco.trim()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Data/Hora</p>
                        <p className="text-gray-800">
                          {pedidoDetails[0].dataImportacao} - {pedidoDetails[0].horaFinal}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Pedido Palm</p>
                        <p className="font-mono text-gray-800">{pedidoDetails[0].pedPalm.trim()}</p>
                      </div>
                    </>
                  )}
                </div>
                {!isDesktop && (
                  <div className="mt-4 space-y-2">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Endereço</p>
                      <p className="text-gray-800">{pedidoDetails[0].endereco.trim()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Data/Hora</p>
                      <p className="text-gray-800">
                        {pedidoDetails[0].dataImportacao} - {pedidoDetails[0].horaFinal}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Pedido Palm</p>
                      <p className="font-mono text-gray-800">{pedidoDetails[0].pedPalm.trim()}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-blue-600 font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Itens do Pedido ({pedidoDetails.length})
                  </h3>
                </div>
                {/* Exibe lista mobile OU tabela desktop, nunca ambos */}
                {isDesktop ? (
                  <div className="w-full overflow-x-hidden">
                    <Table className="min-w-[1200px]">
                      <TableHeader className="bg-blue-50">
                        <TableRow>
                          <TableHead className="text-gray-600 font-medium">Código</TableHead>
                          <TableHead className="text-gray-600 font-medium">Descrição</TableHead>
                          <TableHead className="text-gray-600 font-medium text-right">Ped. Asa</TableHead>
                          <TableHead className="text-gray-600 font-medium text-right">Qtd</TableHead>
                          <TableHead className="text-gray-600 font-medium text-right">Qtd Lib.</TableHead>
                          <TableHead className="text-gray-600 font-medium text-right">Preço</TableHead>
                          <TableHead className="text-gray-600 font-medium text-right">Desconto</TableHead>
                          <TableHead className="text-gray-600 font-medium text-right">Faturado</TableHead>
                          <TableHead className="text-gray-600 font-medium text-right">Lote</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pedidoDetails.map((item) => (
                          <TableRow key={item.id} className="hover:bg-blue-50 transition-colors">
                            <TableCell className="font-mono">{item.codPro}</TableCell>
                            <TableCell className="max-w-[250px] truncate" title={item.descricao.trim()}>
                              {item.descricao.trim()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {item.numC5}-{item.filC5}
                            </TableCell>
                            <TableCell className="text-right font-mono">{item.qtdPro}</TableCell>
                            <TableCell className="text-right font-mono">{item.qtdLib}</TableCell>
                            <TableCell className="text-right font-mono">
                              R$ {item.preco.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-red-600">
                              {item.desconto.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right font-mono text-green-600">
                              R$ {item.totalfat.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono">{item.lote.trim() || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="md:hidden space-y-4 p-4">
                    {pedidoDetails.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-mono text-sm text-blue-600">{item.codPro}</div>
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            R$ {item.totalfat.toFixed(2)}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-2 line-clamp-2" title={item.descricao}>
                          {item.descricao.trim()}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Qtd:</span>
                            <span className="font-mono">{item.qtdPro}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Preço:</span>
                            <span className="font-mono">R$ {item.preco.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Desconto:</span>
                            <span className="font-mono text-red-600">{item.desconto.toFixed(2)}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Lote:</span>
                            <span className="font-mono">{item.lote.trim() || '-'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <h3 className="text-blue-600 font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumo Financeiro
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fornecedor:</span>
                      <span className="font-medium text-gray-800">{pedidoDetails[0].fornecedor.trim()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {pedidoDetails[0].status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Faturado:</span>
                      <span className="font-semibold text-green-600">
                        R$ {pedidoDetails.reduce((sum, item) => sum + item.totalfat, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Total:</span>
                      <span className="font-semibold text-blue-600">
                        R$ {pedidoDetails
                          .reduce((sum, item) => sum + (item.preco * item.qtdPro), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
