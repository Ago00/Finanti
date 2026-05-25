'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAccount, updateAccount, archiveAccount } from '@/features/accounts/actions'
import { GAIN_MODE_LABELS } from '@/features/accounts/domain'
import type { AccountWithBalance, AccountTypeRow } from '@/features/accounts/queries'

type AssetClass = { id: string; name: string; color: string }

type Props = {
  initialAccounts: AccountWithBalance[]
  accountTypes: AccountTypeRow[]
  assetClasses: AssetClass[]
}

type EditState = {
  name: string
  gainMode: 'auto' | 'manual' | 'projects'
  color: string
  accountTypeId: string
  assetClassId: string
}

const GAIN_MODE_OPTIONS: { value: 'auto' | 'manual' | 'projects'; label: string }[] = [
  { value: 'auto', label: GAIN_MODE_LABELS.auto },
  { value: 'manual', label: GAIN_MODE_LABELS.manual },
  { value: 'projects', label: GAIN_MODE_LABELS.projects },
]

const INPUT_CLS =
  'bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1]'

export function AccountsSettings({ initialAccounts, accountTypes, assetClasses }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({
    name: '',
    gainMode: 'auto',
    color: '#6366F1',
    accountTypeId: '',
    assetClassId: '',
  })
  const [editError, setEditError] = useState<string | null>(null)

  // Create state
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGainMode, setNewGainMode] = useState<'auto' | 'manual' | 'projects'>('auto')
  const [newColor, setNewColor] = useState('#6366F1')
  const [newAccountTypeId, setNewAccountTypeId] = useState('')
  const [newAssetClassId, setNewAssetClassId] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  function startEdit(acc: AccountWithBalance) {
    setEditingId(acc.id)
    setEditState({
      name: acc.name,
      gainMode: acc.gainMode,
      color: acc.color,
      accountTypeId: acc.accountTypeId ?? '',
      assetClassId: acc.assetClassId ?? '',
    })
    setEditError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError(null)
  }

  function handleSaveEdit(id: string) {
    if (!editState.name.trim()) {
      setEditError('El nombre no puede estar vacío')
      return
    }
    setEditError(null)
    startTransition(async () => {
      try {
        await updateAccount({
          id,
          name: editState.name,
          gainMode: editState.gainMode,
          color: editState.color,
          accountTypeId: editState.accountTypeId || null,
          assetClassId: editState.assetClassId || null,
        })
        setEditingId(null)
        router.refresh()
      } catch (err) {
        setEditError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  function handleArchive(id: string, name: string) {
    if (!window.confirm(`¿Archivar la cuenta "${name}"? No aparecerá en el patrimonio.`)) return
    startTransition(async () => {
      await archiveAccount(id)
      router.refresh()
    })
  }

  function handleCreate() {
    if (!newName.trim()) return
    setCreateError(null)
    const sortOrder = initialAccounts.length > 0
      ? Math.max(...initialAccounts.map(a => a.sortOrder)) + 1
      : 0
    startTransition(async () => {
      try {
        await createAccount({
          name: newName.trim(),
          gainMode: newGainMode,
          color: newColor,
          icon: 'wallet',
          sortOrder,
          accountTypeId: newAccountTypeId || null,
          assetClassId: newAssetClassId || null,
        })
        setNewName('')
        setNewGainMode('auto')
        setNewColor('#6366F1')
        setNewAccountTypeId('')
        setNewAssetClassId('')
        setShowCreate(false)
        router.refresh()
      } catch (err) {
        setCreateError(err instanceof Error ? err.message : 'Error al crear la cuenta')
      }
    })
  }

  return (
    <div className="space-y-3">
      {initialAccounts.length === 0 && !showCreate && (
        <p className="text-[#64748B] text-sm">No hay cuentas activas.</p>
      )}

      {initialAccounts.map(acc => (
        <div key={acc.id} className="bg-[#141925] border border-[#1E2A3A] rounded-xl px-4 py-3">
          {editingId === acc.id ? (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={editState.name}
                  onChange={e => setEditState(s => ({ ...s, name: e.target.value }))}
                  placeholder="Nombre"
                  className={`flex-1 ${INPUT_CLS}`}
                />
                <select
                  value={editState.gainMode}
                  onChange={e => setEditState(s => ({ ...s, gainMode: e.target.value as EditState['gainMode'] }))}
                  className={INPUT_CLS}
                >
                  {GAIN_MODE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  type="color"
                  value={editState.color}
                  onChange={e => setEditState(s => ({ ...s, color: e.target.value }))}
                  className="w-10 h-9 rounded-lg border border-[#1E2A3A] bg-[#0B0F1A] cursor-pointer"
                  title="Color"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={editState.accountTypeId}
                  onChange={e => setEditState(s => ({ ...s, accountTypeId: e.target.value }))}
                  className={`flex-1 ${INPUT_CLS}`}
                >
                  <option value="">Sin tipo</option>
                  {accountTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <select
                  value={editState.assetClassId}
                  onChange={e => setEditState(s => ({ ...s, assetClassId: e.target.value }))}
                  className={`flex-1 ${INPUT_CLS}`}
                >
                  <option value="">Sin clase</option>
                  {assetClasses.map(ac => (
                    <option key={ac.id} value={ac.id}>{ac.name}</option>
                  ))}
                </select>
              </div>
              {editError && (
                <p className="text-red-400 text-xs">{editError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveEdit(acc.id)}
                  disabled={isPending}
                  className="bg-[#6366F1] hover:bg-[#818CF8] text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40"
                >
                  Guardar
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={isPending}
                  className="text-[#64748B] hover:text-[#94A3B8] text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: acc.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{acc.name}</p>
                <p className="text-[#64748B] text-xs">{GAIN_MODE_LABELS[acc.gainMode]}</p>
              </div>
              <button
                onClick={() => startEdit(acc)}
                disabled={isPending}
                className="text-[#64748B] hover:text-[#94A3B8] text-sm"
              >
                Editar
              </button>
              <button
                onClick={() => handleArchive(acc.id, acc.name)}
                disabled={isPending}
                className="text-[#64748B] hover:text-red-400 text-xs"
              >
                Archivar
              </button>
            </div>
          )}
        </div>
      ))}

      {showCreate ? (
        <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl px-4 py-4 space-y-3">
          <p className="text-[#94A3B8] text-sm font-medium">Nueva cuenta</p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nombre"
              className={`flex-1 ${INPUT_CLS}`}
            />
            <select
              value={newGainMode}
              onChange={e => setNewGainMode(e.target.value as typeof newGainMode)}
              className={INPUT_CLS}
            >
              {GAIN_MODE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="color"
              value={newColor}
              onChange={e => setNewColor(e.target.value)}
              className="w-10 h-9 rounded-lg border border-[#1E2A3A] bg-[#0B0F1A] cursor-pointer"
              title="Color"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={newAccountTypeId}
              onChange={e => setNewAccountTypeId(e.target.value)}
              className={`flex-1 ${INPUT_CLS}`}
            >
              <option value="">Sin tipo</option>
              {accountTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select
              value={newAssetClassId}
              onChange={e => setNewAssetClassId(e.target.value)}
              className={`flex-1 ${INPUT_CLS}`}
            >
              <option value="">Sin clase</option>
              {assetClasses.map(ac => (
                <option key={ac.id} value={ac.id}>{ac.name}</option>
              ))}
            </select>
          </div>
          {createError && (
            <p className="text-red-400 text-xs">{createError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={isPending || !newName.trim()}
              className="bg-[#6366F1] hover:bg-[#818CF8] text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40"
            >
              Crear
            </button>
            <button
              onClick={() => { setShowCreate(false); setCreateError(null) }}
              disabled={isPending}
              className="text-[#64748B] hover:text-[#94A3B8] text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          disabled={isPending}
          className="bg-[#6366F1] hover:bg-[#818CF8] text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40"
        >
          Nueva cuenta
        </button>
      )}
    </div>
  )
}
