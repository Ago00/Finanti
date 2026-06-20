import type { BudgetAnalysis, BudgetLine } from '@/features/budget/domain'
import { BudgetLineEdit } from './budget-line-edit'
import { formatCurrency } from '@/lib/formatting'
import { formatMonthLabel } from '@/lib/dates'

function BudgetLineRow({ line }: { line: BudgetLine }) {
  return (
    <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: line.color }}
          />
          <span className="text-white text-sm font-medium">{line.label}</span>
        </div>
        <span className="text-[#94A3B8] text-sm">
          {line.month && (line.categoryId != null || line.assetClassId != null) ? (
            <>
              <BudgetLineEdit
                month={line.month}
                categoryId={line.categoryId ?? null}
                assetClassId={line.assetClassId ?? null}
                currentPlanned={line.planned}
                label={line.label}
              />
              {' '}planif.
            </>
          ) : (
            <>{formatCurrency(line.planned)} planif.</>
          )}
        </span>
      </div>

      <div className="w-full h-1 rounded-full bg-[#1E2A3A] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${line.overBudget ? 'bg-red-500' : line.type === 'inversion' ? 'bg-emerald-500' : 'bg-[#6366F1]'}`}
          style={{ width: `${line.progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-[#94A3B8]">{formatCurrency(line.actual)} gastado</span>
        <span className={line.restante >= 0 ? 'text-emerald-400' : 'text-red-400'}>
          {formatCurrency(line.restante)} rest.
        </span>
      </div>
    </div>
  )
}

export function BudgetView({ analysis }: { analysis: BudgetAnalysis }) {
  const hasLines = analysis.gastoLines.length > 0 || analysis.inversionLines.length > 0

  return (
    <div className="space-y-4">
      {/* Income card */}
      <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl px-5 py-4 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[#94A3B8] text-sm">Ingresos del mes</span>
          <span className="text-emerald-400 font-semibold">{formatCurrency(analysis.totalIncome)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#94A3B8] text-sm">Sin asignar</span>
          <span className={`font-semibold ${analysis.sinAsignar >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(analysis.sinAsignar)}
          </span>
        </div>
      </div>

      {!hasLines && (
        <div className="rounded-xl bg-[#141925] border border-[#1E2A3A] px-5 py-8 text-center space-y-1">
          <p className="text-[#94A3B8] text-sm font-medium">
            Sin presupuesto para {formatMonthLabel(analysis.month.getUTCFullYear(), analysis.month.getUTCMonth() + 1)}
          </p>
          <p className="text-[#64748B] text-xs">
            Añade tus categorías de gasto e inversiones desde Ajustes para que aparezcan aquí.
          </p>
        </div>
      )}

      {/* Gastos section */}
      {analysis.gastoLines.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[#94A3B8] text-xs uppercase tracking-wide">Gastos</h3>
          {analysis.gastoLines.map((line) => (
            <BudgetLineRow key={line.label} line={line} />
          ))}
        </div>
      )}

      {/* Inversiones section */}
      {analysis.inversionLines.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[#94A3B8] text-xs uppercase tracking-wide">Inversiones</h3>
          {analysis.inversionLines.map((line) => (
            <BudgetLineRow key={line.label} line={line} />
          ))}
        </div>
      )}

      {/* Summary card */}
      {hasLines && (
        <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl px-5 py-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8] text-sm">Total planificado</span>
            <span className="text-white font-semibold">{formatCurrency(analysis.totalPlanned)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8] text-sm">Total ejecutado</span>
            <span className="text-white font-semibold">{formatCurrency(analysis.totalActual)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8] text-sm">Total restante</span>
            <span className={`font-semibold ${analysis.totalRestante >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(analysis.totalRestante)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
