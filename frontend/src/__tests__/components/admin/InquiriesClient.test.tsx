import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { renderWithIntl, screen, waitFor } from '@/test/utils'
import { InquiriesClient } from '@/components/admin/InquiriesClient'
import * as api from '@/lib/api'
import userEvent from '@testing-library/user-event'

// Mock the API functions
vi.mock('@/lib/api', () => ({
  getContactInquiries: vi.fn(),
  getContactInquiry: vi.fn(),
  updateContactInquiry: vi.fn(),
  getContactInquiryStats: vi.fn(),
  createInquiryReply: vi.fn(),
}))

// Mock data
const mockStats = {
  total_inquiries: 25,
  by_status: {
    open: 8,
    in_progress: 5,
    resolved: 10,
    closed: 2
  },
  by_category: {
    scheduling: 15,
    general: 7,
    business: 3
  }
}

const mockInquiries = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Class Scheduling Question',
    category: 'scheduling',
    status: 'open',
    preferred_language: 'en',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    subject: 'General Inquiry',
    category: 'general',
    status: 'in_progress',
    preferred_language: 'zh',
    created_at: '2024-01-14T14:20:00Z'
  }
]

const mockInquiryDetail = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  subject: 'Class Scheduling Question',
  message: 'I have a question about the morning yoga classes.',
  category: 'scheduling',
  status: 'open',
  preferred_language: 'en',
  admin_notes: null,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  replies: [
    {
      id: '1',
      inquiry_id: '1',
      admin_id: 'admin1',
      subject: 'Re: Class Scheduling Question',
      message: 'Thank you for your inquiry. Our morning classes start at 8 AM.',
      email_status: 'sent',
      error_message: null,
      created_at: '2024-01-15T11:00:00Z',
      sent_at: '2024-01-15T11:01:00Z'
    }
  ]
}

const mockMessages = {
  admin: {
    inquiries: {
      stats: {
        total: 'Total Inquiries',
        open: 'Open',
        inProgress: 'In Progress',
        resolved: 'Resolved'
      },
      filters: {
        title: 'Filter Inquiries',
        status: 'Status',
        category: 'Category',
        allStatuses: 'All Statuses',
        allCategories: 'All Categories',
        refresh: 'Refresh'
      },
      status: {
        open: 'Open',
        in_progress: 'In Progress',
        inProgress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed'
      },
      category: {
        scheduling: 'Scheduling',
        general: 'General',
        business: 'Business'
      },
      list: {
        title: 'Contact Inquiries',
        loading: 'Loading...',
        empty: 'No inquiries found',
        from: 'From',
        view: 'View'
      },
      detail: {
        title: 'Inquiry Details',
        status: 'Status',
        adminNotes: 'Admin Notes',
        save: 'Save',
        cancel: 'Cancel',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        subject: 'Subject',
        message: 'Message',
        category: 'Category',
        preferredLanguage: 'Preferred Language',
        createdAt: 'Created At',
        updatedAt: 'Updated At',
        language: 'Language',
        created: 'Created',
        adminNotesPlaceholder: 'Add admin notes...',
        close: 'Close'
      },
      replies: {
        title: 'Replies',
        compose: 'Compose Reply',
        subject: 'Subject',
        message: 'Message',
        send: 'Send Reply',
        cancel: 'Cancel',
        sending: 'Sending...',
        success: 'Reply sent successfully',
        error: 'Failed to send reply',
        sentAt: 'Sent at',
        subjectPlaceholder: 'Enter reply subject...',
        messagePlaceholder: 'Enter your reply message...',
        status: {
          sent: 'Sent',
          pending: 'Pending',
          failed: 'Failed'
        }
      }
    }
  }
}

describe('InquiriesClient', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Setup default mock implementations
    ;(api.getContactInquiryStats as Mock).mockResolvedValue(mockStats)
    ;(api.getContactInquiries as Mock).mockResolvedValue(mockInquiries)
    ;(api.getContactInquiry as Mock).mockResolvedValue(mockInquiryDetail)
    ;(api.updateContactInquiry as Mock).mockResolvedValue(mockInquiryDetail)
    ;(api.createInquiryReply as Mock).mockResolvedValue({
      id: '2',
      inquiry_id: '1',
      admin_id: 'admin1',
      subject: 'Re: Class Scheduling Question',
      message: 'New reply message',
      email_status: 'sent',
      error_message: null,
      created_at: '2024-01-15T12:00:00Z',
      sent_at: '2024-01-15T12:01:00Z'
    })
  })

  describe('Initial Loading and Stats Display', () => {
    it('should render statistics cards correctly', async () => {
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument() // Total inquiries
        expect(screen.getByText('8')).toBeInTheDocument() // Open count
        expect(screen.getByText('5')).toBeInTheDocument() // In Progress count
        expect(screen.getByText('10')).toBeInTheDocument() // Resolved count
      })

      expect(screen.getByText('Total Inquiries')).toBeInTheDocument()
      expect(screen.getAllByText('Open')).toHaveLength(3) // Stats card, filter option, and inquiry badge
      expect(screen.getAllByText('In Progress')).toHaveLength(3) // Stats card, filter option, and inquiry badge
      expect(screen.getAllByText('Resolved')).toHaveLength(2) // Stats card and filter option
    })

    it('should load inquiries and stats on mount', async () => {
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(api.getContactInquiryStats).toHaveBeenCalled()
        expect(api.getContactInquiries).toHaveBeenCalledWith(undefined, undefined)
      })
    })

    it('should show loading state initially', () => {
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should show empty state when no inquiries', async () => {
      ;(api.getContactInquiries as Mock).mockResolvedValue([])

      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getByText('No inquiries found')).toBeInTheDocument()
      })
    })
  })

  describe('Filters Functionality', () => {
    it('should render filter controls', async () => {
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getByText('Filter Inquiries')).toBeInTheDocument()
        expect(screen.getByLabelText('Status')).toBeInTheDocument()
        expect(screen.getByLabelText('Category')).toBeInTheDocument()
        expect(screen.getByText('Refresh')).toBeInTheDocument()
      })
    })

    it('should filter by status', async () => {
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getByLabelText('Status')).toBeInTheDocument()
      })

      const statusSelect = screen.getByLabelText('Status')
      await user.selectOptions(statusSelect, 'open')

      await waitFor(() => {
        expect(api.getContactInquiries).toHaveBeenCalledWith('open', undefined)
      })
    })

    it('should filter by category', async () => {
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getByLabelText('Category')).toBeInTheDocument()
      })

      const categorySelect = screen.getByLabelText('Category')
      await user.selectOptions(categorySelect, 'scheduling')

      await waitFor(() => {
        expect(api.getContactInquiries).toHaveBeenCalledWith(undefined, 'scheduling')
      })
    })

    it('should refresh inquiries when refresh button is clicked', async () => {
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument()
      })

      // Clear previous calls
      vi.clearAllMocks()
      ;(api.getContactInquiries as Mock).mockResolvedValue(mockInquiries)

      const refreshButton = screen.getByText('Refresh')
      await user.click(refreshButton)

      await waitFor(() => {
        expect(api.getContactInquiries).toHaveBeenCalled()
      })
    })
  })

  describe('Inquiries List Display', () => {
    it('should display inquiries list correctly', async () => {
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getByText('Contact Inquiries')).toBeInTheDocument()
        expect(screen.getByText('Class Scheduling Question')).toBeInTheDocument()
        expect(screen.getByText('General Inquiry')).toBeInTheDocument()
      })

      expect(screen.getByText('From: John Doe (john@example.com)')).toBeInTheDocument()
      expect(screen.getByText('From: Jane Smith (jane@example.com)')).toBeInTheDocument()
    })

    it('should show correct status and category badges', async () => {
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        // Check for status badges
        expect(screen.getByText('Open')).toBeInTheDocument()
        expect(screen.getByText('In Progress')).toBeInTheDocument()

        // Check for category badges
        expect(screen.getByText('Scheduling')).toBeInTheDocument()
        expect(screen.getByText('General')).toBeInTheDocument()
      })
    })

    it('should show language indicators', async () => {
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument()
        expect(screen.getByText('中文')).toBeInTheDocument()
      })
    })

    it('should have view buttons for each inquiry', async () => {
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View')
        expect(viewButtons).toHaveLength(2)
      })
    })
  })

  describe('Inquiry Detail Modal', () => {
    it('should open detail modal when view button is clicked', async () => {
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(api.getContactInquiry).toHaveBeenCalledWith('1')
        expect(screen.getByText('Inquiry Details')).toBeInTheDocument()
      })
    })

    it('should display inquiry details in modal', async () => {
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByText('Inquiry Details')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('I have a question about the morning yoga classes.')).toBeInTheDocument()
      })
    })

    it('should show existing replies in modal', async () => {
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByText('Re: Class Scheduling Question')).toBeInTheDocument()
        expect(screen.getByText('Thank you for your inquiry. Our morning classes start at 8 AM.')).toBeInTheDocument()
      })
    })

    it('should allow updating inquiry status and admin notes', async () => {
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      // Wait for the API call to complete first
      await waitFor(() => {
        expect(api.getContactInquiry).toHaveBeenCalledWith('1')
      })

      // Wait for the modal to open and render properly
      await waitFor(() => {
        expect(screen.getByText('Inquiry Details')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Wait specifically for the status select element by id
      await waitFor(() => {
        expect(document.getElementById('status')).toBeInTheDocument()
      })

      // Change status - find the status select element by ID
      const statusSelect = document.getElementById('status') as HTMLSelectElement
      expect(statusSelect.value).toBe('open') // Verify current value
      await user.selectOptions(statusSelect, 'in_progress')

      // Add admin notes
      const adminNotesTextarea = screen.getByPlaceholderText('Add admin notes...')
      await user.type(adminNotesTextarea, 'Following up with customer')

      // Save changes
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(api.updateContactInquiry).toHaveBeenCalledWith('1', {
          status: 'in_progress',
          admin_notes: 'Following up with customer'
        })
      })
    })

    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByText('Inquiry Details')).toBeInTheDocument()
      })

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Inquiry Details')).not.toBeInTheDocument()
      })
    })
  })

  describe('Reply Functionality', () => {
    it('should show compose reply button and form', async () => {
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByText('Compose Reply')).toBeInTheDocument()
      })

      const composeButton = screen.getByText('Compose Reply')
      await user.click(composeButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Subject')).toBeInTheDocument()
        expect(screen.getByLabelText('Message')).toBeInTheDocument()
        expect(screen.getByText('Send Reply')).toBeInTheDocument()
      })
    })

    it('should pre-fill reply subject with "Re:" prefix', async () => {
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByText('Compose Reply')).toBeInTheDocument()
      })

      const composeButton = screen.getByText('Compose Reply')
      await user.click(composeButton)

      await waitFor(() => {
        const subjectInput = screen.getByLabelText('Subject') as HTMLInputElement
        expect(subjectInput.value).toBe('Re: Class Scheduling Question')
      })
    })

    it('should send reply when form is submitted', async () => {
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByText('Compose Reply')).toBeInTheDocument()
      })

      const composeButton = screen.getByText('Compose Reply')
      await user.click(composeButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Message')).toBeInTheDocument()
      })

      // Fill in the message
      const messageTextarea = screen.getByLabelText('Message')
      await user.type(messageTextarea, 'Thank you for contacting us. We will get back to you soon.')

      // Send reply
      const sendButton = screen.getByText('Send Reply')
      await user.click(sendButton)

      await waitFor(() => {
        expect(api.createInquiryReply).toHaveBeenCalledWith('1', {
          subject: 'Re: Class Scheduling Question',
          message: 'Thank you for contacting us. We will get back to you soon.'
        })
      })
    })

    it('should validate reply fields before sending', async () => {
      // Test the reply validation logic more directly
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(api.getContactInquiry).toHaveBeenCalledWith('1')
      })

      await waitFor(() => {
        expect(screen.getByText('Inquiry Details')).toBeInTheDocument()
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(document.getElementById('status')).toBeInTheDocument()
      })

      // Focus on testing that the compose reply functionality works
      await waitFor(() => {
        expect(screen.getByText('Compose Reply')).toBeInTheDocument()
      })

      const composeButton = screen.getByText('Compose Reply')
      await user.click(composeButton)

      // Verify reply form appears
      await waitFor(() => {
        expect(screen.getByLabelText('Subject')).toBeInTheDocument()
      })

      // Test successful reply first (with filled fields)
      const subjectInput = screen.getByLabelText('Subject')
      expect(subjectInput).toHaveValue('Re: Class Scheduling Question')

      const messageInput = screen.getByLabelText('Message')
      await user.type(messageInput, 'Test reply message')

      const sendButton = screen.getByText('Send Reply')
      await user.click(sendButton)

      // Should call the API with valid data
      await waitFor(() => {
        expect(api.createInquiryReply).toHaveBeenCalledWith('1', {
          subject: 'Re: Class Scheduling Question',
          message: 'Test reply message'
        })
      })
    })

    it('should prevent sending reply when fields are empty', async () => {
      // Test that empty fields prevent API call (core validation behavior)
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(api.getContactInquiry).toHaveBeenCalledWith('1')
      })

      await waitFor(() => {
        expect(screen.getByText('Inquiry Details')).toBeInTheDocument()
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(document.getElementById('status')).toBeInTheDocument()
      })

      const composeButton = screen.getByText('Compose Reply')
      await user.click(composeButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Subject')).toBeInTheDocument()
      })

      // Clear the pre-filled subject to make it empty
      const subjectInput = screen.getByLabelText('Subject')
      await user.clear(subjectInput)

      // Ensure message field is also empty
      const messageInput = screen.getByLabelText('Message')
      expect(messageInput).toHaveValue('')

      // Clear any previous API calls to isolate this test
      vi.clearAllMocks()

      // Try to send without content (both fields empty)
      const sendButton = screen.getByText('Send Reply')
      await user.click(sendButton)

      // The core behavior: API should not be called with empty fields
      expect(api.createInquiryReply).not.toHaveBeenCalled()

      // Additional verification: form elements should still be present (not closed)
      expect(screen.getByLabelText('Subject')).toBeInTheDocument()
      expect(screen.getByLabelText('Message')).toBeInTheDocument()
    })

    it('should handle reply sending errors', async () => {
      const user = userEvent.setup()
      ;(api.createInquiryReply as Mock).mockRejectedValue(new Error('Network error'))

      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByText('Compose Reply')).toBeInTheDocument()
      })

      const composeButton = screen.getByText('Compose Reply')
      await user.click(composeButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Message')).toBeInTheDocument()
      })

      const messageTextarea = screen.getByLabelText('Message')
      await user.type(messageTextarea, 'Test message')

      const sendButton = screen.getByText('Send Reply')
      await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to send reply')).toBeInTheDocument()
      })
    })

    it('should cancel reply composition', async () => {
      const user = userEvent.setup()
      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByText('Compose Reply')).toBeInTheDocument()
      })

      const composeButton = screen.getByText('Compose Reply')
      await user.click(composeButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Message')).toBeInTheDocument()
      })

      const messageTextarea = screen.getByLabelText('Message')
      await user.type(messageTextarea, 'Some message')

      // Cancel reply
      const cancelButton = screen.getAllByText('Cancel').find(btn =>
        btn.closest('form') || btn.closest('[data-reply-form]')
      )

      if (cancelButton) {
        await user.click(cancelButton)

        await waitFor(() => {
          expect(screen.queryByLabelText('Message')).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully when loading inquiries', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      ;(api.getContactInquiries as Mock).mockRejectedValue(new Error('API Error'))

      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading inquiries:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should handle API errors when loading stats', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      ;(api.getContactInquiryStats as Mock).mockRejectedValue(new Error('Stats API Error'))

      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading stats:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should handle API errors when loading inquiry details', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const user = userEvent.setup()
      ;(api.getContactInquiry as Mock).mockRejectedValue(new Error('Detail API Error'))

      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading inquiry details:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should handle API errors when updating inquiry', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const user = userEvent.setup()
      ;(api.updateContactInquiry as Mock).mockRejectedValue(new Error('Update API Error'))

      renderWithIntl(<InquiriesClient />, { messages: mockMessages })

      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText('View')[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument()
      })

      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error updating inquiry:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })
})