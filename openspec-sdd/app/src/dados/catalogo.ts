import type { Peca } from './tipos'

/** Catálogo semente: 12 peças com estoque inicial por peça. */
export const CATALOGO: Peca[] = [
  { id: 'camiseta-basica', nome: 'Camiseta Básica', categoria: 'camiseta', preco: 49.9, cor: '#f4f4f5', slotId: 'arara-1-s1', estoqueSemente: 5 },
  { id: 'camiseta-listrada', nome: 'Camiseta Listrada', categoria: 'camiseta', preco: 69.9, cor: '#3b82f6', slotId: 'arara-1-s2', estoqueSemente: 3 },
  { id: 'camisa-linho', nome: 'Camisa de Linho', categoria: 'camisa', preco: 159.9, cor: '#e7d8b1', slotId: 'arara-1-s3', estoqueSemente: 2 },
  { id: 'jaqueta-jeans', nome: 'Jaqueta Jeans', categoria: 'jaqueta', preco: 249.9, cor: '#1e3a8a', slotId: 'arara-2-s1', estoqueSemente: 1 },
  { id: 'moletom-capuz', nome: 'Moletom com Capuz', categoria: 'moletom', preco: 189.9, cor: '#6b7280', slotId: 'arara-2-s2', estoqueSemente: 4 },
  { id: 'jaqueta-couro', nome: 'Jaqueta de Couro', categoria: 'jaqueta', preco: 499.9, cor: '#1c1917', slotId: 'arara-2-s3', estoqueSemente: 2 },
  { id: 'vestido-floral', nome: 'Vestido Floral', categoria: 'vestido', preco: 199.9, cor: '#f472b6', slotId: 'arara-3-s1', estoqueSemente: 3 },
  { id: 'vestido-preto', nome: 'Vestido Preto', categoria: 'vestido', preco: 229.9, cor: '#27272a', slotId: 'arara-3-s2', estoqueSemente: 6 },
  { id: 'saia-midi', nome: 'Saia Midi', categoria: 'saia', preco: 139.9, cor: '#a16207', slotId: 'arara-3-s3', estoqueSemente: 1 },
  { id: 'calca-jeans', nome: 'Calça Jeans', categoria: 'calca', preco: 179.9, cor: '#2563eb', slotId: 'prateleira-1-n1c1', estoqueSemente: 8 },
  { id: 'calca-sarja', nome: 'Calça Sarja', categoria: 'calca', preco: 149.9, cor: '#65a30d', slotId: 'prateleira-1-n2c1', estoqueSemente: 4 },
  { id: 'bermuda-moletom', nome: 'Bermuda de Moletom', categoria: 'bermuda', preco: 89.9, cor: '#f97316', slotId: 'prateleira-2-n1c1', estoqueSemente: 5 },
]
