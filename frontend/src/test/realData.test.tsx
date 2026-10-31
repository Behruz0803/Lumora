/**
 * Real-data workflow: the demo notice follows the dataset, and the import page
 * validates a CSV before anything is written.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { calls, callsTo, installFetchMock } from './mockApi'

const TOKEN_KEY = 'priceradar_token'

function renderAt(path: string, options: Parameters<typeof installFetchMock>[0] = {}) {
  localStorage.setItem(TOKEN_KEY, 'test-token')
  installFetchMock({ authenticated: true, ...options })
  window.history.pushState({}, '', path)
  return render(<App />)
}

function csvFile(name = 'prices.csv') {
  const content =
    'product,supplier,unit_price,delivery_cost,minimum_order_quantity,available_quantity,status\n' +
    'Potatoes,Tashkent Agro Trade,3900,40000,50,1200,in_stock\n' +
    'Potatoes,Fergana Fresh Produce,3500,50000,50,800,in_stock\n' +
    'Onions,Bukhara Farm Direct,,25000,100,500,in_stock\n'
  return new File([content], name, { type: 'text/csv' })
}

beforeEach(() => {
  localStorage.clear()
  calls.length = 0
})

describe('demo notice follows the dataset', () => {
  it('shows the demo warning while the catalogue is demo data', async () => {
    renderAt('/products', { dataSource: 'demo' })
    await waitFor(() => expect(screen.getByText(/Demo dataset\./i)).toBeInTheDocument())
  })

  it('switches to a real-data notice once every price was imported', async () => {
    renderAt('/products', { dataSource: 'real' })
    await waitFor(() => expect(screen.getByText(/Imported price list\./i)).toBeInTheDocument())
    expect(screen.queryByText(/Demo dataset\./i)).not.toBeInTheDocument()
  })

  it('keeps a warning when real and demo rows are mixed', async () => {
    renderAt('/products', { dataSource: 'mixed' })
    await waitFor(() => expect(screen.getByText(/Mixed data set\./i)).toBeInTheDocument())
  })
})

describe('price list import page', () => {
  it('is reachable from the sidebar and explains the required columns', async () => {
    renderAt('/data-import')
    expect(await screen.findByRole('heading', { name: /import real prices/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /import prices/i })).toBeInTheDocument()
    expect(screen.getByText(/Required columns: product, supplier, unit_price/i)).toBeInTheDocument()
  })

  it('reports how much of the dataset is real', async () => {
    renderAt('/data-import', { dataSource: 'demo' })
    await waitFor(() => expect(screen.getByText(/Demo data only/i)).toBeInTheDocument())
    expect(screen.getByText(/Price rows/i)).toBeInTheDocument()
  })

  it('checks a CSV without writing anything', async () => {
    const user = userEvent.setup()
    renderAt('/data-import', { dataSource: 'demo' })

    const input = (await screen.findByLabelText(/upload csv price list/i)) as HTMLInputElement
    await user.upload(input, csvFile())
    expect(await screen.findByText('prices.csv')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /check file \(no changes\)/i }))

    expect(await screen.findByText(/Check result — nothing saved yet/i)).toBeInTheDocument()
    const upload = callsTo('/api/import/prices')
    expect(upload).toHaveLength(1)
    expect(upload[0].url).toContain('dry_run=true')
    expect(screen.getByText(/Rows that could not be imported/i)).toBeInTheDocument()
    expect(screen.getByText('unit_price')).toBeInTheDocument()
  })

  it('imports the file and refreshes the dataset badge', async () => {
    const user = userEvent.setup()
    renderAt('/data-import', { dataSource: 'demo' })

    const input = (await screen.findByLabelText(/upload csv price list/i)) as HTMLInputElement
    await user.upload(input, csvFile())
    await user.click(screen.getByRole('button', { name: /^import prices$/i }))

    expect(await screen.findByText(/Import result/i)).toBeInTheDocument()
    const upload = callsTo('/api/import/prices')
    expect(upload).toHaveLength(1)
    expect(upload[0].url).not.toContain('dry_run')
    // the dataset status is re-fetched so the notice can change immediately
    await waitFor(() => expect(callsTo('/api/dataset/status').length).toBeGreaterThan(1))
  })

  it('surfaces a server-side column error instead of failing silently', async () => {
    const user = userEvent.setup()
    renderAt('/data-import', { dataSource: 'demo', failImport: true })

    const input = (await screen.findByLabelText(/upload csv price list/i)) as HTMLInputElement
    await user.upload(input, csvFile('broken.csv'))
    await user.click(screen.getByRole('button', { name: /check file \(no changes\)/i }))

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText(/Missing required column/i)).toBeInTheDocument()
  })

  it('disables the upload buttons until a file is chosen', async () => {
    renderAt('/data-import', { dataSource: 'demo' })
    const check = await screen.findByRole('button', { name: /check file \(no changes\)/i })
    expect(check).toBeDisabled()
    expect(screen.getByRole('button', { name: /^import prices$/i })).toBeDisabled()
  })
})
