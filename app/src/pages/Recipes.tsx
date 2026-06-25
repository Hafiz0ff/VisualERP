import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import type { BOMDetail } from '../api/types'
import { AlertTriangle, PackageCheck } from 'lucide-react'

function formatQuantity(value: number | string): string {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : String(value)
}

function formatWaste(value: number | string | null): string {
  if (value === null || value === undefined) return '0%'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? `${numeric.toLocaleString()}%` : `${value}%`
}

export default function Recipes() {
  const { data: bomsRes, loading, error, refetch } = useApiQuery<{ data: BOMDetail[] }>('/api/boms', {
    params: { pageSize: 100 },
  })

  const recipes = bomsRes?.data || []
  const activeCount = recipes.filter((recipe) => recipe.isActive).length
  const totalLines = recipes.reduce((sum, recipe) => sum + recipe.lines.length, 0)

  if (loading) {
    return (
      <Layout title="Рецептуры">
        <div className="bg-white border border-[#D4CFC8] p-4 mb-4 animate-pulse h-16 rounded" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-white border border-[#D4CFC8] animate-pulse rounded" />
          ))}
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Рецептуры">
        <div className="bg-white border border-red-200 p-6 text-center my-8 rounded">
          <AlertTriangle className="mx-auto text-red-500 mb-3" size={24} />
          <h3 className="text-red-600 font-semibold text-[14px] mb-2">Не удалось загрузить рецептуры</h3>
          <p className="text-[12px] text-[#5E5E5E] mb-4">Проверьте подключение к API или перезагрузите страницу.</p>
          <button onClick={refetch} className="h-9 px-4 bg-[#C0563F] text-white text-[12px] font-medium rounded hover:bg-[#A84835]">Повторить попытку</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Рецептуры">
      <div className="bg-white border border-[#D4CFC8] p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded bg-[#5A8A6E]/10 text-[#5A8A6E]">
            <PackageCheck size={18} />
          </div>
          <div>
            <div className="text-[13px] text-[#5E5E5E]">
              Рецептур: <strong>{recipes.length}</strong> | Активных: <strong>{activeCount}</strong> | Строк состава: <strong>{totalLines}</strong>
            </div>
            <div className="text-[11px] text-[#9E9E9E] mt-0.5">
              Составы берутся из backend BOM и используются при выпуске продукции.
            </div>
          </div>
        </div>
        <span className="text-[11px] px-2 py-1 rounded bg-[#F6F5F2] text-[#5E5E5E] border border-[#D4CFC8]">
          Создание рецептур будет подключено отдельно
        </span>
      </div>

      <div className="space-y-4">
        {recipes.length === 0 ? (
          <div className="bg-white border border-[#D4CFC8] p-8 text-center text-[13px] text-[#5E5E5E]">
            Рецептуры отсутствуют.
          </div>
        ) : (
          recipes.map((recipe) => {
            const totalWeight = recipe.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0)
            return (
              <div key={recipe.id} className="bg-white border border-[#D4CFC8]">
                <div className="px-5 py-3 border-b border-[#D4CFC8] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] font-mono text-[#5E5E5E]">{recipe.version}</span>
                    <div>
                      <h3 className="text-[14px] font-semibold text-[#2B2B2B]">{recipe.name}</h3>
                      <div className="text-[11px] text-[#5E5E5E] mt-0.5">
                        Готовая продукция: {recipe.outputItem.name} {recipe.outputItem.code ? `(${recipe.outputItem.code})` : ''}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded font-medium ${recipe.isActive ? 'bg-[#5A8A6E]/10 text-[#5A8A6E]' : 'bg-[#9E9E9E]/10 text-[#5E5E5E]'}`}>
                    {recipe.isActive ? 'Активна' : 'Неактивна'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F6F5F2]">
                      <tr>
                        <th className="px-5 py-2 text-[11px] text-[#5E5E5E] text-left">Ингредиент</th>
                        <th className="px-5 py-2 text-[11px] text-[#5E5E5E] text-right">Кол-во на 1 мешок</th>
                        <th className="px-5 py-2 text-[11px] text-[#5E5E5E] text-center">Ед.</th>
                        <th className="px-5 py-2 text-[11px] text-[#5E5E5E] text-right">Потери</th>
                        <th className="px-5 py-2 text-[11px] text-[#5E5E5E] text-right">Доля</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEBE6]">
                      {recipe.lines.map((line) => {
                        const lineQuantity = Number(line.quantity || 0)
                        const percent = totalWeight > 0 ? (lineQuantity / totalWeight) * 100 : 0
                        return (
                          <tr key={line.id} className="hover:bg-[#F6F5F2]">
                            <td className="px-5 py-2 text-[12px] text-[#2B2B2B]">
                              {line.inputItem.name}
                              {line.inputItem.code && <span className="ml-2 text-[10px] text-[#9E9E9E] font-mono">{line.inputItem.code}</span>}
                            </td>
                            <td className="px-5 py-2 text-[12px] text-right font-mono">{formatQuantity(line.quantity)}</td>
                            <td className="px-5 py-2 text-[12px] text-center">{line.unit.symbol}</td>
                            <td className="px-5 py-2 text-[12px] text-right font-mono">{formatWaste(line.wastePercent)}</td>
                            <td className="px-5 py-2 text-[12px] text-right font-mono">{percent.toFixed(1)}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })
        )}
      </div>
    </Layout>
  )
}
