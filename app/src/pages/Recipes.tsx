import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useApp } from '@/store/AppContext'
import { Plus, X, Trash2 } from 'lucide-react'

interface RItem { materialId: string; materialName: string; quantityPerUnit: number; unit: string }

export default function Recipes() {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [selProduct, setSelProduct] = useState('')
  const [items, setItems] = useState<RItem[]>([{ materialId: '', materialName: '', quantityPerUnit: 0, unit: '' }])

  const mbc = state.rawMaterials.reduce<Record<string, typeof state.rawMaterials>>((a, m) => { if (!a[m.category]) a[m.category] = []; a[m.category].push(m); return a }, {})
  const existing = new Set(state.recipes.map((r) => r.productId))
  const missing = state.finishedProducts.filter((p) => !existing.has(p.id))

  const hChange = (i: number, f: string, v: unknown) => {
    const ni = [...items]
    if (f === 'materialId') { const m = state.rawMaterials.find((x) => x.id === v); ni[i] = { ...ni[i], materialId: v as string, materialName: m?.name || '', unit: m?.unit || '' } }
    else if (f === 'qty') ni[i] = { ...ni[i], quantityPerUnit: Number(v) }
    setItems(ni)
  }

  const hSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = state.finishedProducts.find((pr) => pr.id === selProduct)
    if (!p) return
    const valid = items.filter((i) => i.materialId && i.quantityPerUnit > 0)
    if (!valid.length) return
    dispatch({ type: 'ADD_RECIPE', payload: { productId: selProduct, productName: p.name, yieldPerBatch: 1, ingredients: valid } })
    setShowForm(false); setSelProduct(''); setItems([{ materialId: '', materialName: '', quantityPerUnit: 0, unit: '' }])
  }

  return (
    <Layout title="Рецептуры">
      <div className="bg-white border border-[#D4CFC8] p-4 mb-4 flex items-center justify-between">
        <span className="text-[13px] text-[#5E5E5E]">Рецептур: <strong>{state.recipes.length}</strong> | Без рецепта: <strong className="text-[#F0A830]">{missing.length}</strong></span>
        <button onClick={() => { setShowForm(true); setSelProduct(''); setItems([{ materialId: '', materialName: '', quantityPerUnit: 0, unit: '' }]) }} className="h-9 px-4 bg-[#C0563F] text-white text-[13px] font-medium rounded hover:bg-[#A84835] flex items-center gap-2"><Plus size={15} strokeWidth={2.5} /> Создать</button>
      </div>

      {showForm && (
        <form onSubmit={hSubmit} className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] font-semibold">Новая рецептура</h3><button type="button" onClick={() => setShowForm(false)} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button></div>
          <div className="mb-4"><label className="text-[12px] text-[#5E5E5E] block mb-1">Продукт</label><select value={selProduct} onChange={(e) => setSelProduct(e.target.value)} className="h-9 w-96 px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded"><option value="">Выберите...</option>{missing.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="mb-4">
            <label className="text-[12px] text-[#5E5E5E] block mb-2">Ингредиенты (на 1 мешок)</label>
            <div className="border border-[#D4CFC8] rounded overflow-hidden">
              <table className="w-full"><thead className="bg-[#EFEBE6]"><tr><th className="px-3 py-2 text-[11px] font-semibold text-left">Сырьё</th><th className="px-3 py-2 text-[11px] font-semibold text-center w-32">Кол-во</th><th className="px-3 py-2 text-[11px] font-semibold text-center w-20">Ед.</th><th className="px-3 py-2 text-[11px] font-semibold text-center w-10"></th></tr></thead>
                <tbody className="divide-y divide-[#EFEBE6]">{items.map((it, idx) => (<tr key={idx} className="bg-white">
                  <td className="px-3 py-2"><select value={it.materialId} onChange={(e) => hChange(idx, 'materialId', e.target.value)} className="h-8 w-full px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded"><option value="">Выберите...</option>{Object.entries(mbc).map(([cat, mats]) => <optgroup key={cat} label={cat}>{mats.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>)}</select></td>
                  <td className="px-3 py-2"><input type="number" value={it.quantityPerUnit || ''} onChange={(e) => hChange(idx, 'qty', Number(e.target.value))} className="h-8 w-full px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded text-center" min="0" step="0.01" /></td>
                  <td className="px-3 py-2 text-center text-[12px] text-[#5E5E5E]">{it.unit || '-'}</td>
                  <td className="px-3 py-2 text-center">{items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, j) => j !== idx))} className="text-[#9E9E9E] hover:text-[#C0563F]"><X size={14} /></button>}</td>
                </tr>))}</tbody>
              </table>
            </div>
            <button type="button" onClick={() => setItems([...items, { materialId: '', materialName: '', quantityPerUnit: 0, unit: '' }])} className="mt-2 text-[12px] text-[#C0563F] font-medium flex items-center gap-1"><Plus size={12} /> Добавить</button>
          </div>
          <div className="flex items-center justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 text-[13px] font-medium text-[#5E5E5E] bg-white border border-[#D4CFC8] rounded hover:bg-[#F6F5F2]">Отмена</button><button type="submit" disabled={!selProduct || items.filter((i) => i.materialId && i.quantityPerUnit > 0).length === 0} className="h-9 px-5 text-[13px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835] disabled:opacity-50">Создать</button></div>
        </form>
      )}

      <div className="space-y-4">
        {state.recipes.map((recipe) => {
          const product = state.finishedProducts.find((p) => p.id === recipe.productId)
          const tw = recipe.ingredients.reduce((s, i) => s + i.quantityPerUnit, 0)
          return (
            <div key={recipe.id} className="bg-white border border-[#D4CFC8]">
              <div className="px-5 py-3 border-b border-[#D4CFC8] flex items-center justify-between">
                <div className="flex items-center gap-4"><span className="text-[12px] font-mono text-[#5E5E5E]">{recipe.id}</span><h3 className="text-[14px] font-semibold">{product?.name || recipe.productName}</h3><span className="text-[11px] text-[#9E9E9E] bg-[#F6F5F2] px-2 py-0.5 rounded">{product?.packaging}</span></div>
                <button onClick={() => { if (confirm('Удалить?')) dispatch({ type: 'DELETE_RECIPE', id: recipe.id }) }} className="p-1.5 text-[#5E5E5E] hover:text-[#C0563F] hover:bg-[#C0563F]/10 rounded"><Trash2 size={14} /></button>
              </div>
              <div className="overflow-x-auto"><table className="w-full"><thead className="bg-[#F6F5F2]"><tr><th className="px-5 py-2 text-[11px] text-[#5E5E5E] text-left">Ингредиент</th><th className="px-5 py-2 text-[11px] text-[#5E5E5E] text-right">Кол-во</th><th className="px-5 py-2 text-[11px] text-[#5E5E5E] text-center">Ед.</th><th className="px-5 py-2 text-[11px] text-[#5E5E5E] text-right">%</th></tr></thead>
                <tbody className="divide-y divide-[#EFEBE6]">{recipe.ingredients.map((ing) => (<tr key={ing.materialId} className="hover:bg-[#F6F5F2]"><td className="px-5 py-2 text-[12px]">{ing.materialName}</td><td className="px-5 py-2 text-[12px] text-right font-mono">{ing.quantityPerUnit.toLocaleString()}</td><td className="px-5 py-2 text-[12px] text-center">{ing.unit}</td><td className="px-5 py-2 text-[12px] text-right font-mono">{tw > 0 ? ((ing.quantityPerUnit / tw) * 100).toFixed(1) : 0}%</td></tr>))}</tbody>
              </table></div>
            </div>
          )
        })}
      </div>
    </Layout>
  )
}
