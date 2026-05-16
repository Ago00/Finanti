import { ImportSection } from './import-section'

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Importar datos</h1>
          <p className="text-[#94A3B8] text-sm">
            Importa tus archivos Excel para poblar la base de datos.
            Las importaciones son idempotentes — puedes volver a ejecutarlas sin duplicar datos.
          </p>
        </div>

        <ImportSection
          title="Gastos"
          description="Gastos.xlsx — hoja «Respuestas de formulario 1»"
          actionType="gastos"
        />

        <ImportSection
          title="SuperChic (patrimonio e ingresos)"
          description="SuperChic 2.xlsx — cuentas, snapshots mensuales e ingresos desde oct 2023"
          actionType="superchic"
        />
      </div>
    </div>
  )
}
