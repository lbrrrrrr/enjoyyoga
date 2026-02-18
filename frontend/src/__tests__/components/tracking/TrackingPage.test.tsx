import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithIntl, screen, waitFor } from '@/test/utils'
import TrackingPage from '@/app/[locale]/track/[token]/page'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  getRegistrationsByToken: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useParams: () => ({ token: 'valid-token-123' }),
}))

const mockMessages = {
  tracking: {
    title: 'My Registrations',
    email: 'Email',
    loading: 'Loading...',
    invalidLink: 'This tracking link is invalid or has expired.',
    requestNewLink: 'Request a new link',
    noRegistrations: 'No registrations found.',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    registeredOn: 'Registered On',
    paymentStatus: 'Payment Status',
    referenceNumber: 'Reference Number',
    amount: 'Amount',
    statusConfirmed: 'Confirmed',
    statusPendingPayment: 'Pending Payment',
    statusWaitlist: 'Waitlist',
    statusCancelled: 'Cancelled',
    paymentConfirmed: 'Paid',
    paymentPending: 'Pending',
    paymentCancelled: 'Cancelled',
    lostLink: 'Lost your tracking link?',
  },
}

const mockTrackingData: api.TrackingResponse = {
  email: 'john@example.com',
  registrations: [
    {
      registration_id: 'reg-1',
      class_name_en: 'Morning Hatha',
      class_name_zh: '晨间哈他',
      status: 'confirmed',
      target_date: '2026-03-15',
      target_time: '08:00',
      created_at: '2026-01-15T00:00:00Z',
      payment_status: 'confirmed',
      reference_number: 'EY-20260215-AB3X',
      amount: 100.0,
      currency: 'CNY',
    },
  ],
  total: 1,
}

describe('TrackingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state initially', () => {
    ;(api.getRegistrationsByToken as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {}) // never resolves
    )

    renderWithIntl(<TrackingPage />, { messages: mockMessages })

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should display registrations after loading', async () => {
    ;(api.getRegistrationsByToken as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTrackingData
    )

    renderWithIntl(<TrackingPage />, { messages: mockMessages })

    await waitFor(() => {
      expect(screen.getByText('My Registrations')).toBeInTheDocument()
    })

    // Email is rendered as "Email: john@example.com" split across text nodes
    expect(screen.getByText(/john@example\.com/)).toBeInTheDocument()
    expect(screen.getByText('Morning Hatha')).toBeInTheDocument()
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })

  it('should display payment info', async () => {
    ;(api.getRegistrationsByToken as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTrackingData
    )

    renderWithIntl(<TrackingPage />, { messages: mockMessages })

    await waitFor(() => {
      expect(screen.getByText('Paid')).toBeInTheDocument()
    })

    expect(screen.getByText('EY-20260215-AB3X')).toBeInTheDocument()
  })

  it('should show error state for invalid token', async () => {
    ;(api.getRegistrationsByToken as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Not found')
    )

    renderWithIntl(<TrackingPage />, { messages: mockMessages })

    await waitFor(() => {
      expect(screen.getByText('This tracking link is invalid or has expired.')).toBeInTheDocument()
    })

    expect(screen.getByText('Request a new link')).toBeInTheDocument()
  })

  it('should show empty state when no registrations', async () => {
    ;(api.getRegistrationsByToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      email: 'empty@example.com',
      registrations: [],
      total: 0,
    })

    renderWithIntl(<TrackingPage />, { messages: mockMessages })

    await waitFor(() => {
      expect(screen.getByText('No registrations found.')).toBeInTheDocument()
    })
  })

  it('should show recovery link at bottom', async () => {
    ;(api.getRegistrationsByToken as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTrackingData
    )

    renderWithIntl(<TrackingPage />, { messages: mockMessages })

    await waitFor(() => {
      expect(screen.getByText('Lost your tracking link?')).toBeInTheDocument()
    })
  })

  it('should display pending payment status', async () => {
    const pendingData: api.TrackingResponse = {
      email: 'test@example.com',
      registrations: [
        {
          registration_id: 'reg-2',
          class_name_en: 'Evening Flow',
          class_name_zh: '晚间流瑜伽',
          status: 'pending_payment',
          target_date: '2026-03-16',
          target_time: '19:00',
          created_at: '2026-01-16T00:00:00Z',
          payment_status: 'pending',
          reference_number: 'EY-20260216-CD5Y',
          amount: 80.0,
          currency: 'CNY',
        },
      ],
      total: 1,
    }

    ;(api.getRegistrationsByToken as ReturnType<typeof vi.fn>).mockResolvedValue(
      pendingData
    )

    renderWithIntl(<TrackingPage />, { messages: mockMessages })

    await waitFor(() => {
      expect(screen.getByText('Pending Payment')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })
  })

  it('should call API with correct token', async () => {
    ;(api.getRegistrationsByToken as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTrackingData
    )

    renderWithIntl(<TrackingPage />, { messages: mockMessages })

    await waitFor(() => {
      expect(api.getRegistrationsByToken).toHaveBeenCalledWith('valid-token-123')
    })
  })
})
