import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithIntl, screen, waitFor } from '@/test/utils'
import { ConsentModal } from '@/components/forms/ConsentModal'
import * as api from '@/lib/api'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/api', () => ({
  signConsent: vi.fn(),
}))

const mockMessages = {
  consent: {
    modal: {
      title: 'Sign Health & Liability Waiver',
      cancel: 'Cancel',
    },
    waiverText: 'I acknowledge that yoga involves physical activity...',
    form: {
      name: 'Full Name',
      namePlaceholder: 'Enter your full name as signature',
      email: 'Email Address',
      emailPlaceholder: 'Enter your email address',
      agree: 'I have read and agree to the above waiver',
      submit: 'Sign Waiver',
      submitting: 'Signing...',
    },
    error: 'Something went wrong. Please try again.',
  },
}

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  yogaTypeId: 'yt-1',
  yogaTypeName: 'Hatha Yoga',
  locale: 'en',
  prefillName: 'John Doe',
  prefillEmail: 'john@example.com',
}

describe('ConsentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(api.signConsent as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'consent-1',
      email: 'john@example.com',
      name: 'John Doe',
      yoga_type_id: 'yt-1',
    })
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      renderWithIntl(
        <ConsentModal {...defaultProps} isOpen={false} />,
        { messages: mockMessages }
      )

      expect(screen.queryByText('Sign Health & Liability Waiver')).not.toBeInTheDocument()
    })

    it('should render modal title and waiver text when open', () => {
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      expect(screen.getByText('Sign Health & Liability Waiver')).toBeInTheDocument()
      expect(screen.getByText('I acknowledge that yoga involves physical activity...')).toBeInTheDocument()
    })

    it('should display yoga type name', () => {
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      expect(screen.getByText('Hatha Yoga')).toBeInTheDocument()
    })

    it('should pre-fill name from registration form', () => {
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      const nameInput = screen.getByLabelText('Full Name') as HTMLInputElement
      expect(nameInput.value).toBe('John Doe')
    })

    it('should pre-fill email as read-only', () => {
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement
      expect(emailInput.value).toBe('john@example.com')
      expect(emailInput).toHaveAttribute('readOnly')
    })

    it('should have checkbox unchecked by default', () => {
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      const checkbox = screen.getByLabelText('I have read and agree to the above waiver') as HTMLInputElement
      expect(checkbox.checked).toBe(false)
    })

    it('should have submit button disabled until checkbox is checked', () => {
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      const submitButton = screen.getByText('Sign Waiver')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Interaction', () => {
    it('should enable submit button when checkbox is checked and name is filled', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      const checkbox = screen.getByLabelText('I have read and agree to the above waiver')
      await user.click(checkbox)

      const submitButton = screen.getByText('Sign Waiver')
      expect(submitButton).not.toBeDisabled()
    })

    it('should keep submit button disabled when name is empty even if checkbox is checked', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <ConsentModal {...defaultProps} prefillName="" />,
        { messages: mockMessages }
      )

      const checkbox = screen.getByLabelText('I have read and agree to the above waiver')
      await user.click(checkbox)

      const submitButton = screen.getByText('Sign Waiver')
      expect(submitButton).toBeDisabled()
    })

    it('should allow editing the name field', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <ConsentModal {...defaultProps} prefillName="" />,
        { messages: mockMessages }
      )

      const nameInput = screen.getByLabelText('Full Name')
      await user.type(nameInput, 'Jane Smith')

      expect(nameInput).toHaveValue('Jane Smith')
    })
  })

  describe('Submission', () => {
    it('should call signConsent API on submit', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      const checkbox = screen.getByLabelText('I have read and agree to the above waiver')
      await user.click(checkbox)

      const submitButton = screen.getByText('Sign Waiver')
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.signConsent).toHaveBeenCalledWith({
          email: 'john@example.com',
          name: 'John Doe',
          yoga_type_id: 'yt-1',
        })
      })
    })

    it('should call onSuccess and onClose after successful submission', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      const checkbox = screen.getByLabelText('I have read and agree to the above waiver')
      await user.click(checkbox)

      const submitButton = screen.getByText('Sign Waiver')
      await user.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled()
        expect(defaultProps.onClose).toHaveBeenCalled()
      })
    })

    it('should show loading state during submission', async () => {
      // Make signConsent hang to test loading state
      ;(api.signConsent as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const user = userEvent.setup()
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      const checkbox = screen.getByLabelText('I have read and agree to the above waiver')
      await user.click(checkbox)

      const submitButton = screen.getByText('Sign Waiver')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Signing...')).toBeInTheDocument()
      })
    })

    it('should show error message on API failure', async () => {
      ;(api.signConsent as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      )

      const user = userEvent.setup()
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      const checkbox = screen.getByLabelText('I have read and agree to the above waiver')
      await user.click(checkbox)

      const submitButton = screen.getByText('Sign Waiver')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should not call onSuccess on API failure', async () => {
      ;(api.signConsent as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      )

      const user = userEvent.setup()
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      const checkbox = screen.getByLabelText('I have read and agree to the above waiver')
      await user.click(checkbox)

      const submitButton = screen.getByText('Sign Waiver')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      expect(defaultProps.onSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Close / Cancel', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should call onClose when X button is clicked', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      // The X button is an SVG inside a button
      const closeButton = screen.getByText('Sign Health & Liability Waiver')
        .closest('.flex')!
        .querySelector('button')!
      await user.click(closeButton)

      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should not call signConsent when cancelled', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <ConsentModal {...defaultProps} />,
        { messages: mockMessages }
      )

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(api.signConsent).not.toHaveBeenCalled()
    })
  })
})
