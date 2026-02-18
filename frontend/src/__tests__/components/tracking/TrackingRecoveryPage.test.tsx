import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithIntl, screen, waitFor } from '@/test/utils'
import TrackingRecoveryPage from '@/app/[locale]/track/page'
import * as api from '@/lib/api'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/api', () => ({
  requestTrackingLink: vi.fn(),
}))

const mockMessages = {
  tracking: {
    recovery: {
      title: 'Find Your Registrations',
      subtitle: 'Enter your email to receive a tracking link.',
      email: 'Email Address',
      emailPlaceholder: 'Enter your email address',
      submit: 'Send Tracking Link',
      sending: 'Sending...',
      success: 'If an account exists for this email, a tracking link has been sent.',
      error: 'Something went wrong. Please try again.',
    },
  },
}

describe('TrackingRecoveryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the recovery form', () => {
    renderWithIntl(<TrackingRecoveryPage />, { messages: mockMessages })

    expect(screen.getByText('Find Your Registrations')).toBeInTheDocument()
    expect(screen.getByText('Enter your email to receive a tracking link.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Tracking Link' })).toBeInTheDocument()
  })

  it('should submit email and show success message', async () => {
    ;(api.requestTrackingLink as ReturnType<typeof vi.fn>).mockResolvedValue({
      message: 'Link sent',
    })

    const { user } = renderWithIntl(<TrackingRecoveryPage />, {
      messages: mockMessages,
    })

    const emailInput = screen.getByLabelText('Email Address')
    await user.type(emailInput, 'test@example.com')

    const submitButton = screen.getByRole('button', { name: 'Send Tracking Link' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(
        'If an account exists for this email, a tracking link has been sent.'
      )).toBeInTheDocument()
    })

    expect(api.requestTrackingLink).toHaveBeenCalledWith('test@example.com', expect.any(String))
  })

  it('should show error message on failure', async () => {
    ;(api.requestTrackingLink as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Server error')
    )

    const { user } = renderWithIntl(<TrackingRecoveryPage />, {
      messages: mockMessages,
    })

    const emailInput = screen.getByLabelText('Email Address')
    await user.type(emailInput, 'test@example.com')

    const submitButton = screen.getByRole('button', { name: 'Send Tracking Link' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    ;(api.requestTrackingLink as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => setTimeout(() => resolve({ message: 'ok' }), 1000))
    )

    const { user } = renderWithIntl(<TrackingRecoveryPage />, {
      messages: mockMessages,
    })

    const emailInput = screen.getByLabelText('Email Address')
    await user.type(emailInput, 'test@example.com')

    const submitButton = screen.getByRole('button', { name: 'Send Tracking Link' })
    await user.click(submitButton)

    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled()
  })

  it('should not submit with empty email', async () => {
    const { user } = renderWithIntl(<TrackingRecoveryPage />, {
      messages: mockMessages,
    })

    const submitButton = screen.getByRole('button', { name: 'Send Tracking Link' })
    await user.click(submitButton)

    expect(api.requestTrackingLink).not.toHaveBeenCalled()
  })

  it('should call API with correct locale', async () => {
    ;(api.requestTrackingLink as ReturnType<typeof vi.fn>).mockResolvedValue({
      message: 'ok',
    })

    const { user } = renderWithIntl(<TrackingRecoveryPage />, {
      messages: mockMessages,
      locale: 'en',
    })

    const emailInput = screen.getByLabelText('Email Address')
    await user.type(emailInput, 'test@example.com')

    const submitButton = screen.getByRole('button', { name: 'Send Tracking Link' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.requestTrackingLink).toHaveBeenCalledWith('test@example.com', 'en')
    })
  })
})
