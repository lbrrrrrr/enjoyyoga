import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithIntl, screen, waitFor } from '@/test/utils'
import { RegistrationForm } from '@/components/forms/RegistrationForm'
import * as api from '@/lib/api'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/api', () => ({
  createRegistration: vi.fn(),
  createRegistrationWithSchedule: vi.fn(),
  checkConsent: vi.fn(),
  signConsent: vi.fn(),
  getAvailableDates: vi.fn().mockResolvedValue([]),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

const mockMessages = {
  register: {
    title: 'Register for a Class',
    selectClass: 'Select a class',
    name: 'Your Name',
    email: 'Email Address',
    phone: 'Phone Number (optional)',
    message: 'Message (optional)',
    submit: 'Submit Registration',
    success: 'Registration submitted successfully!',
    error: 'Something went wrong. Please try again.',
    free: 'Free',
    classPrice: 'Class Price',
    perSession: 'session',
    submitAndPay: 'Register & Proceed to Payment',
    preferredLanguage: 'Preferred Language',
    emailNotifications: 'Email notifications',
    smsNotifications: 'SMS reminders',
    selectPaymentMethod: 'Select Payment Method',
    wechatPay: 'WeChat Pay',
    venmo: 'Venmo',
    selectOption: 'Select payment option',
    singleSession: 'Single Session',
    sessions: 'sessions',
  },
  consent: {
    check: {
      warning: 'You need to sign a health & liability waiver before registering for this class.',
      signWaiver: 'Sign Waiver',
      checking: 'Checking waiver status...',
    },
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

const mockClasses: api.YogaClass[] = [
  {
    id: 'class-1',
    name_en: 'Morning Hatha',
    name_zh: '晨间哈他',
    description_en: 'Gentle morning yoga',
    description_zh: '温和的晨间瑜伽',
    teacher_id: 'teacher-1',
    yoga_type_id: 'yt-1',
    schedule: 'Mon/Wed/Fri 8:00 AM',
    duration_minutes: 60,
    difficulty: 'beginner',
    capacity: 20,
    location: 'Studio A',
    created_at: '2024-01-01T00:00:00Z',
    price: null,
    price_usd: null,
    currency: 'CNY',
    teacher: {
      id: 'teacher-1',
      name_en: 'Sarah',
      name_zh: '莎拉',
      bio_en: '',
      bio_zh: '',
      qualifications: '',
      photo_url: null,
      created_at: '2024-01-01T00:00:00Z',
    },
    yoga_type: {
      id: 'yt-1',
      name_en: 'Hatha Yoga',
      name_zh: '哈他瑜伽',
      description_en: 'Gentle yoga',
      description_zh: '温和瑜伽',
    },
    packages: [],
  },
  {
    id: 'class-2',
    name_en: 'Evening Vinyasa',
    name_zh: '晚间流瑜伽',
    description_en: 'Evening flow',
    description_zh: '晚间流动瑜伽',
    teacher_id: 'teacher-1',
    yoga_type_id: 'yt-2',
    schedule: 'Tue/Thu 7:00 PM',
    duration_minutes: 75,
    difficulty: 'intermediate',
    capacity: 15,
    location: null,
    created_at: '2024-01-01T00:00:00Z',
    price: null,
    price_usd: null,
    currency: 'CNY',
    teacher: {
      id: 'teacher-1',
      name_en: 'Sarah',
      name_zh: '莎拉',
      bio_en: '',
      bio_zh: '',
      qualifications: '',
      photo_url: null,
      created_at: '2024-01-01T00:00:00Z',
    },
    yoga_type: {
      id: 'yt-2',
      name_en: 'Vinyasa Yoga',
      name_zh: '流瑜伽',
      description_en: 'Dynamic flow',
      description_zh: '动态流瑜伽',
    },
    packages: [],
  },
]

describe('RegistrationForm - Consent Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(api.checkConsent as ReturnType<typeof vi.fn>).mockResolvedValue({ has_consent: false })
    ;(api.signConsent as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'consent-1',
      email: 'john@example.com',
      name: 'John Doe',
      yoga_type_id: 'yt-1',
    })
  })

  describe('Consent Check Timing', () => {
    it('should check consent when both email and class are present', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <RegistrationForm classes={mockClasses} locale="en" />,
        { messages: mockMessages }
      )

      // Select a class first
      const classSelect = screen.getByLabelText('Select a class')
      await user.selectOptions(classSelect, 'class-1')

      // Then enter email
      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'john@example.com')

      await waitFor(() => {
        expect(api.checkConsent).toHaveBeenCalledWith('john@example.com', 'yt-1')
      })
    })

    it('should check consent when class is selected after email is entered', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <RegistrationForm classes={mockClasses} locale="en" />,
        { messages: mockMessages }
      )

      // Enter email first
      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'john@example.com')

      // Then select a class — useEffect should trigger the check
      const classSelect = screen.getByLabelText('Select a class')
      await user.selectOptions(classSelect, 'class-1')

      await waitFor(() => {
        expect(api.checkConsent).toHaveBeenCalledWith('john@example.com', 'yt-1')
      })
    })

    it('should re-check consent when class changes', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <RegistrationForm classes={mockClasses} locale="en" />,
        { messages: mockMessages }
      )

      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'john@example.com')

      const classSelect = screen.getByLabelText('Select a class')
      await user.selectOptions(classSelect, 'class-1')

      await waitFor(() => {
        expect(api.checkConsent).toHaveBeenCalledWith('john@example.com', 'yt-1')
      })

      vi.clearAllMocks()
      ;(api.checkConsent as ReturnType<typeof vi.fn>).mockResolvedValue({ has_consent: false })

      // Change to a different class
      await user.selectOptions(classSelect, 'class-2')

      await waitFor(() => {
        expect(api.checkConsent).toHaveBeenCalledWith('john@example.com', 'yt-2')
      })
    })

    it('should not check consent when only email is entered without class', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <RegistrationForm classes={mockClasses} locale="en" />,
        { messages: mockMessages }
      )

      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'john@example.com')

      // Wait a tick, then verify no check was made
      await new Promise(r => setTimeout(r, 100))
      expect(api.checkConsent).not.toHaveBeenCalled()
    })
  })

  describe('Consent Warning and Modal', () => {
    it('should show warning when consent is missing', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <RegistrationForm classes={mockClasses} locale="en" />,
        { messages: mockMessages }
      )

      const classSelect = screen.getByLabelText('Select a class')
      await user.selectOptions(classSelect, 'class-1')

      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'john@example.com')

      await waitFor(() => {
        expect(screen.getByText('You need to sign a health & liability waiver before registering for this class.')).toBeInTheDocument()
      })
    })

    it('should show Sign Waiver button (not a link) when consent is missing', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <RegistrationForm classes={mockClasses} locale="en" />,
        { messages: mockMessages }
      )

      const classSelect = screen.getByLabelText('Select a class')
      await user.selectOptions(classSelect, 'class-1')

      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'john@example.com')

      await waitFor(() => {
        const signWaiverButton = screen.getByText('Sign Waiver')
        // It should be a button, not an anchor link
        expect(signWaiverButton.tagName).toBe('BUTTON')
      })
    })

    it('should disable submit button when consent is missing', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <RegistrationForm classes={mockClasses} locale="en" />,
        { messages: mockMessages }
      )

      const classSelect = screen.getByLabelText('Select a class')
      await user.selectOptions(classSelect, 'class-1')

      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'john@example.com')

      await waitFor(() => {
        expect(screen.getByText('Submit Registration')).toBeDisabled()
      })
    })

    it('should open consent modal when Sign Waiver button is clicked', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <RegistrationForm classes={mockClasses} locale="en" />,
        { messages: mockMessages }
      )

      const classSelect = screen.getByLabelText('Select a class')
      await user.selectOptions(classSelect, 'class-1')

      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'john@example.com')

      await waitFor(() => {
        expect(screen.getByText('Sign Waiver')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Sign Waiver'))

      await waitFor(() => {
        expect(screen.getByText('Sign Health & Liability Waiver')).toBeInTheDocument()
        expect(screen.getByText('I acknowledge that yoga involves physical activity...')).toBeInTheDocument()
      })
    })

    it('should pre-fill name and email in the consent modal', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <RegistrationForm classes={mockClasses} locale="en" />,
        { messages: mockMessages }
      )

      // Fill name and email first
      const nameInput = screen.getByLabelText('Your Name')
      await user.type(nameInput, 'John Doe')

      const classSelect = screen.getByLabelText('Select a class')
      await user.selectOptions(classSelect, 'class-1')

      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'john@example.com')

      await waitFor(() => {
        expect(screen.getByText('Sign Waiver')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Sign Waiver'))

      await waitFor(() => {
        // Modal should have pre-filled fields
        const modalNameInput = screen.getByLabelText('Full Name') as HTMLInputElement
        expect(modalNameInput.value).toBe('John Doe')

        const modalEmailInput = screen.getByLabelText('Email Address', { selector: '[readOnly]' }) as HTMLInputElement
        expect(modalEmailInput.value).toBe('john@example.com')
      })
    })

    it('should enable submit after signing waiver in modal', async () => {
      const user = userEvent.setup()
      renderWithIntl(
        <RegistrationForm classes={mockClasses} locale="en" />,
        { messages: mockMessages }
      )

      // Enter name first (before selecting class, so it's captured when ConsentModal mounts)
      const nameInput = screen.getByLabelText('Your Name')
      await user.type(nameInput, 'John Doe')

      const classSelect = screen.getByLabelText('Select a class')
      await user.selectOptions(classSelect, 'class-1')

      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'john@example.com')

      await waitFor(() => {
        expect(screen.getByText('Submit Registration')).toBeDisabled()
      })

      // Open modal — click the warning banner's Sign Waiver button
      await user.click(screen.getByText('Sign Waiver'))

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Sign Health & Liability Waiver')).toBeInTheDocument()
      })

      // Check agreement
      const checkbox = screen.getByLabelText('I have read and agree to the above waiver')
      await user.click(checkbox)

      // Find the modal's submit button — it's inside the fixed overlay (z-50)
      const modalOverlay = screen.getByText('Sign Health & Liability Waiver').closest('[class*="fixed"]')!
      const modalSubmitButton = modalOverlay.querySelector('button[type="submit"]') as HTMLButtonElement

      await user.click(modalSubmitButton)

      await waitFor(() => {
        expect(api.signConsent).toHaveBeenCalledWith({
          email: 'john@example.com',
          name: 'John Doe',
          yoga_type_id: 'yt-1',
        })
      })

      // After successful signing, submit button should be enabled
      await waitFor(() => {
        expect(screen.getByText('Submit Registration')).not.toBeDisabled()
      })
    })
  })

  describe('Consent Granted', () => {
    it('should not show warning when consent already exists', async () => {
      ;(api.checkConsent as ReturnType<typeof vi.fn>).mockResolvedValue({ has_consent: true })

      const user = userEvent.setup()
      renderWithIntl(
        <RegistrationForm classes={mockClasses} locale="en" />,
        { messages: mockMessages }
      )

      const classSelect = screen.getByLabelText('Select a class')
      await user.selectOptions(classSelect, 'class-1')

      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'john@example.com')

      await waitFor(() => {
        expect(api.checkConsent).toHaveBeenCalled()
      })

      expect(screen.queryByText('You need to sign a health & liability waiver before registering for this class.')).not.toBeInTheDocument()
      expect(screen.getByText('Submit Registration')).not.toBeDisabled()
    })
  })

  describe('Fail-open on Error', () => {
    it('should not block registration when consent check API fails', async () => {
      ;(api.checkConsent as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API down'))

      const user = userEvent.setup()
      renderWithIntl(
        <RegistrationForm classes={mockClasses} locale="en" />,
        { messages: mockMessages }
      )

      const classSelect = screen.getByLabelText('Select a class')
      await user.selectOptions(classSelect, 'class-1')

      const emailInput = screen.getByLabelText('Email Address')
      await user.type(emailInput, 'john@example.com')

      await waitFor(() => {
        expect(api.checkConsent).toHaveBeenCalled()
      })

      // Should not show warning and should not block submission
      expect(screen.queryByText('You need to sign a health & liability waiver before registering for this class.')).not.toBeInTheDocument()
      expect(screen.getByText('Submit Registration')).not.toBeDisabled()
    })
  })
})
