import { useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, FileUp, Upload, X } from 'lucide-react'
import { api, ApiError } from '../services/api'
import { useDataset } from '../context/DatasetContext'
import { useToast } from '../context/ToastContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge } from '../components/ui/Badge'
import { DemoNotice } from '../components/DemoNotice'
import { LoadingBlock } from '../components/ui/States'
import { formatMoney, formatNumber } from '../utils/format'
import { cn } from '../utils/cn'
import { tr } from '../i18n/core'
import type { ImportReport } from '../types'

/**
 * Real price list import.
 *
 * The page is deliberately two-step: "Check file" validates the CSV and shows
 * exactly what would change, and only "Import" writes to the catalogue. Nothing
 * imported here is ever labelled demo data.
 */
export function ImportPage() {
  const { status, loading, refresh } = useDataset()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState<'preview' | 'import' | null>(null)
  const [report, setReport] = useState<ImportReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setFile(null)
    setReport(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const run = async (dryRun: boolean) => {
    if (!file || busy) return
    setBusy(dryRun ? 'preview' : 'import')
    setError(null)
    try {
      const result = await api.importPrices(file, dryRun)
      setReport(result)
      if (!dryRun) {
        await refresh()
        toast.success(
          tr('Imported {count} price rows as real market data.', { count: result.rows_valid }),
        )
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : tr('The file could not be imported.')
      setError(message)
      toast.error(message)
    } finally {
      setBusy(null)
    }
  }

  const sourceLabel =
    status?.data_source === 'real'
      ? tr('Real imported prices')
      : status?.data_source === 'mixed'
        ? tr('Mixed: real prices plus demo rows')
        : tr('Demo data only')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr('Data sources')}
        title={tr('Import real prices')}
        description={tr(
          'Upload the price list you received from your suppliers. Imported prices replace demo values in every comparison, chart and recommendation.',
        )}
        actions={
          <a
            href={api.priceListTemplateUrl()}
            className="btn-secondary"
            download="priceradar-price-list.csv"
            data-testid="template-download"
          >
            <Download className="h-4 w-4" />
            {tr('CSV template')}
          </a>
        }
      />

      <DemoNotice />

      <section className="card p-5" aria-labelledby="dataset-status-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="dataset-status-heading" className="text-sm font-semibold text-ink">
              {tr('Dataset status')}
            </h2>
            <p className="mt-1 text-xs text-ink-muted">{sourceLabel}</p>
          </div>
          <Badge tone={status?.data_source === 'real' ? 'green' : status?.data_source === 'mixed' ? 'amber' : 'neutral'}>
            {status?.data_source === 'real'
              ? tr('Real data')
              : status?.data_source === 'mixed'
                ? tr('Partially real')
                : tr('Demo data')}
          </Badge>
        </div>

        {loading && !status ? (
          <div className="mt-4">
            <LoadingBlock rows={1} label={tr('Loading dataset status…')} />
          </div>
        ) : (
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: tr('Products'),
                real: status?.products_real ?? 0,
                demo: status?.products_demo ?? 0,
              },
              {
                label: tr('Suppliers'),
                real: status?.suppliers_real ?? 0,
                demo: status?.suppliers_demo ?? 0,
              },
              {
                label: tr('Price rows'),
                real: status?.offers_real ?? 0,
                demo: status?.offers_demo ?? 0,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-line bg-canvas/60 p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  <span className="font-semibold text-brand-700">{item.real}</span>{' '}
                  {tr('real')} · <span className="font-medium">{item.demo}</span> {tr('demo')}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="card p-5" aria-labelledby="upload-heading">
        <h2 id="upload-heading" className="text-sm font-semibold text-ink">
          {tr('Upload a CSV price list')}
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          {tr(
            'Required columns: product, supplier, unit_price. Optional: delivery_cost, minimum_order_quantity, available_quantity, status, category, unit, phone, location.',
          )}
        </p>

        <div
          className={cn(
            'mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition-colors',
            file ? 'border-brand-300 bg-brand-50/40' : 'border-line bg-canvas/60',
          )}
        >
          <input
            ref={inputRef}
            id="price-list-file"
            type="file"
            accept=".csv,text/csv"
            aria-label={tr('Upload CSV price list')}
            className="sr-only"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              setReport(null)
              setError(null)
            }}
          />
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
            <FileSpreadsheet className="h-5 w-5" aria-hidden />
          </span>
          {file ? (
            <>
              <p className="text-sm font-semibold text-ink">{file.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {formatNumber(file.size)} {tr('bytes')}
              </p>
              <button type="button" onClick={reset} className="btn-secondary mt-3 py-2 text-xs">
                <X className="h-3.5 w-3.5" />
                {tr('Remove file')}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-ink">{tr('No file selected')}</p>
              <label htmlFor="price-list-file" className="btn-secondary mt-3 cursor-pointer py-2 text-xs">
                <FileUp className="h-3.5 w-3.5" />
                {tr('Choose CSV file')}
              </label>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void run(true)}
            disabled={!file || busy !== null}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === 'preview' ? tr('Checking…') : tr('Check file (no changes)')}
          </button>
          <button
            type="button"
            onClick={() => void run(false)}
            disabled={!file || busy !== null}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {busy === 'import' ? tr('Importing…') : tr('Import prices')}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 flex items-start gap-2 text-xs text-danger">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}
      </section>

      {report && <ImportResult report={report} />}
    </div>
  )
}

function ImportResult({ report }: { report: ImportReport }) {
  const hasErrors = report.errors.length > 0
  return (
    <section className="space-y-4" aria-live="polite">
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            {report.dry_run ? (
              <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-brand-600" aria-hidden />
            )}
            {report.dry_run ? tr('Check result — nothing saved yet') : tr('Import result')}
          </h2>
          <Badge tone={hasErrors ? 'amber' : 'green'}>
            {tr('{valid} of {total} rows valid', {
              valid: report.rows_valid,
              total: report.rows_received,
            })}
          </Badge>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: tr('New prices'), value: report.offers_created },
            { label: tr('Updated prices'), value: report.offers_updated },
            { label: tr('New products'), value: report.products_created },
            { label: tr('New suppliers'), value: report.suppliers_created },
            { label: tr('Rejected rows'), value: report.rows_failed },
            { label: tr('Total rows'), value: report.rows_received },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-line bg-canvas/60 p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-lg font-semibold text-ink">{item.value}</dd>
            </div>
          ))}
        </dl>

        {hasErrors && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-ink">{tr('Rows that could not be imported')}</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-ink-muted">
                    <th className="py-1.5 pr-3 font-semibold">{tr('Row')}</th>
                    <th className="py-1.5 pr-3 font-semibold">{tr('Column')}</th>
                    <th className="py-1.5 font-semibold">{tr('Problem')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.errors.map((item, index) => (
                    <tr key={`${item.row}-${index}`} className="border-t border-line">
                      <td className="py-1.5 pr-3 font-medium text-ink">{item.row}</td>
                      <td className="py-1.5 pr-3 text-ink-muted">{item.field ?? '—'}</td>
                      <td className="py-1.5 text-ink-soft">{item.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {report.warnings.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-[#7A5615]">
            {report.warnings.map((warning) => (
              <li key={warning} className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                {warning}
              </li>
            ))}
          </ul>
        )}
      </div>

      {report.preview.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-3">
            <h3 className="text-sm font-semibold text-ink">
              {report.dry_run ? tr('Rows that will be imported') : tr('Imported rows')}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-canvas/60 text-[11px] uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-4 py-2 font-semibold">{tr('Row')}</th>
                  <th className="px-4 py-2 font-semibold">{tr('Product')}</th>
                  <th className="px-4 py-2 font-semibold">{tr('Supplier')}</th>
                  <th className="px-4 py-2 font-semibold">{tr('Unit price')}</th>
                  <th className="px-4 py-2 font-semibold">{tr('Delivery')}</th>
                  <th className="px-4 py-2 font-semibold">{tr('Min. order')}</th>
                  <th className="px-4 py-2 font-semibold">{tr('Available')}</th>
                </tr>
              </thead>
              <tbody>
                {report.preview.map((row) => (
                  <tr key={row.row} className="border-t border-line">
                    <td className="px-4 py-2 text-ink-muted">{row.row}</td>
                    <td className="px-4 py-2 font-medium text-ink">{row.product}</td>
                    <td className="px-4 py-2 text-ink-soft">{row.supplier}</td>
                    <td className="px-4 py-2 text-ink">{formatMoney(row.unit_price)}</td>
                    <td className="px-4 py-2 text-ink-soft">{formatMoney(row.delivery_cost)}</td>
                    <td className="px-4 py-2 text-ink-soft">{row.minimum_order_quantity}</td>
                    <td className="px-4 py-2 text-ink-soft">{row.available_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
